/**
 * 答案码：量表作答的通用导出／导入格式（跨设备、跨量表）
 *
 * 形如   X2.<base64url(JSON{v,s,n,t,d})>
 *   v  版本号（2）
 *   s  量表 id（wippf / stress / resources …）
 *   n  称呼（最多 12 字，可空）
 *   t  生成时间（Unix 秒，仅用于显示「什么时候导出的」）
 *   d  题序数字串：0 = 未答，其余为「分值 − min + 1」
 *      用偏移而不是原始分值，是为了让 0 分档（资源图谱的「十次里 0–1 次」）也能表示
 *
 * 兼容旧码：W1.<base64url(JSON{v,n,d})> —— 早期只有 WIPPF 一版，按 1–4 原始分值存，无时间。
 *
 * 安全说明：只含称呼与选项，不含设备、位置、账号、IP；纯前端编解码，不经过服务器。
 */

export interface ScaleSpec {
  /** 量表 id，写进码里用于校验，如 'wippf' */
  id: string;
  /** 展示名，用于「这是压力测评的码」这类提示 */
  label: string;
  /** 题序（长度即题数） */
  itemIds: string[];
  /** 最低分档对应的分值（WIPPF=1，资源图谱=0） */
  min: number;
  /** 最高分档对应的分值 */
  max: number;
}

const CODE_PREFIX = 'X2.';
const LEGACY_PREFIX = 'W1.';

/** 已知量表的中文名，用于跨量表误贴时给一句人话 */
export const SCALE_LABELS: Record<string, string> = {
  wippf: 'WIPPF 威斯巴登问卷',
  stress: '压力应对测评',
  resources: '资源图谱 · 十种能力',
};

const labelOf = (id: string) => SCALE_LABELS[id] ?? id;

/* ---------- base64url ---------- */

const toBase64Url = (s: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromBase64Url = (s: string) => {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
};

/* ---------- 作答 ⇄ 数字串 ---------- */

export function answersToDigits(answers: Record<string, number>, spec: ScaleSpec): string {
  return spec.itemIds
    .map(id => {
      const v = answers[id];
      if (typeof v !== 'number') return '0';
      const digit = v - spec.min + 1;
      return digit >= 1 && digit <= 9 ? String(digit) : '0';
    })
    .join('');
}

export function digitsToAnswers(digits: string, spec: ScaleSpec): Record<string, number> {
  const out: Record<string, number> = {};
  spec.itemIds.forEach((id, i) => {
    const digit = Number(digits[i]);
    if (digit >= 1 && digit <= 9) {
      const v = digit + spec.min - 1;
      if (v <= spec.max) out[id] = v;
    }
  });
  return out;
}

export function answeredCountOf(digits: string): number {
  return [...digits].filter(c => c >= '1' && c <= '9').length;
}

/* ---------- 生成 ---------- */

/** 生成答案码：称呼 + 全部作答 + 导出时间，可安全贴进聊天窗口 */
export function encodeAnswers(answers: Record<string, number>, name: string, spec: ScaleSpec): string {
  const payload = {
    v: 2,
    s: spec.id,
    n: (name || '').trim().slice(0, 12),
    t: Math.floor(Date.now() / 1000),
    d: answersToDigits(answers, spec),
  };
  return CODE_PREFIX + toBase64Url(JSON.stringify(payload));
}

/* ---------- 解析 ---------- */

export interface ParsedCode {
  scale: string | null;
  name: string;
  digits: string;
  createdAt: number | null;
  legacy: boolean;
}

/** 只拆开看「这是哪个量表、谁的、答了多少题」，不校验与当前页是否匹配 */
export function peekCode(raw: string): ParsedCode | null {
  try {
    const text = raw.replace(/\s+/g, '');
    if (!text) return null;

    const legacy = text.startsWith(LEGACY_PREFIX);
    const body = legacy ? text.slice(LEGACY_PREFIX.length) : text.replace(/^X2\./, '');
    if (!body || body === text) return null;

    const obj = JSON.parse(fromBase64Url(body)) as { v?: number; s?: string; n?: string; t?: number; d?: string };
    const digits = String(obj.d ?? '');
    if (!digits || /[^0-9]/.test(digits)) return null;

    return {
      scale: legacy ? 'wippf' : (obj.s ?? null),
      name: String(obj.n ?? '').slice(0, 12),
      digits,
      createdAt: typeof obj.t === 'number' ? obj.t : null,
      legacy,
    };
  } catch {
    return null;
  }
}

export type DecodeResult =
  | {
    ok: true;
    name: string;
    digits: string;
    answers: Record<string, number>;
    answered: number;
    total: number;
    createdAt: number | null;
  }
  | {
    ok: false;
    reason: 'empty' | 'format' | 'scale' | 'incomplete';
    message: string;
  };

/** 按当前量表校验并还原作答 */
export function decodeAnswerCode(raw: string, spec: ScaleSpec): DecodeResult {
  if (!raw.trim()) {
    return { ok: false, reason: 'empty', message: '还没有粘贴答案码。' };
  }

  const parsed = peekCode(raw);
  if (!parsed) {
    return {
      ok: false,
      reason: 'format',
      message: `答案码无法识别：请确认整串都复制进来（通常以 ${CODE_PREFIX} 开头，旧码 ${LEGACY_PREFIX} 也认）。`,
    };
  }

  if (parsed.scale && parsed.scale !== spec.id) {
    return {
      ok: false,
      reason: 'scale',
      message: `这是「${labelOf(parsed.scale)}」的答案码，本页只能读取「${spec.label}」的答案码。`,
    };
  }

  if (parsed.digits.length > spec.itemIds.length) {
    return {
      ok: false,
      reason: 'format',
      message: `答案码长度不对（${parsed.digits.length} 位，本量表应为 ${spec.itemIds.length} 位），可能复制串了。`,
    };
  }

  const digits = parsed.digits.padEnd(spec.itemIds.length, '0');
  const answers = digitsToAnswers(digits, spec);
  const answered = answeredCountOf(digits);

  if (answered < spec.itemIds.length) {
    return {
      ok: false,
      reason: 'incomplete',
      message: `这份答案码只答了 ${answered} / ${spec.itemIds.length} 题，还没答满，无法用于对照。`,
    };
  }

  return {
    ok: true,
    name: parsed.name,
    digits,
    answers,
    answered,
    total: spec.itemIds.length,
    createdAt: parsed.createdAt,
  };
}

/* ---------- 导出为文件 ---------- */

export function downloadCodeFile(code: string, spec: ScaleSpec, name: string, kind?: string) {
  const safe = (name || 'answer').replace(/[\\/:*?"<>|\s]+/g, '-').slice(0, 20);
  const filename = `x2ya-${spec.id}-${safe}${kind ? `-${kind}` : ''}.txt`;
  const head = [
    `${spec.label} 答案码（x2ya.com）`,
    `称呼：${name || '—'}`,
    `导出：${new Date().toLocaleString('zh-CN')}`,
    '',
    '把下面这一整行粘贴到 x2ya.com 对应量表页的「我有对方的答案码」里即可还原本次作答。',
    '',
  ].join('\n');
  const blob = new Blob([head + code + '\n'], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
