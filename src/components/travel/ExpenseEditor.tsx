/**
 * ExpenseEditor — 花费对比编辑
 * 计划花费（从攻略自动填），实际花费（用户填）
 */
import type { ExpenseEntry } from '../../data/travelTypes';

interface Props {
  expenses: ExpenseEntry[];
  onChange: (expenses: ExpenseEntry[]) => void;
}

export default function ExpenseEditor({ expenses, onChange }: Props) {
  if (expenses.length === 0) {
    return (
      <div className="je-field">
        <label className="je-label">💰 花费</label>
        <p className="je-empty-hint">当天无花费记录</p>
      </div>
    );
  }

  const update = (idx: number, field: keyof ExpenseEntry, value: string) => {
    const next = expenses.map((e, i) =>
      i === idx ? { ...e, [field]: value } : e,
    );
    onChange(next);
  };

  return (
    <div className="je-field">
      <label className="je-label">💰 花费记录</label>
      <table className="je-expense-table">
        <thead>
          <tr>
            <th>项目</th>
            <th>计划</th>
            <th>实际</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e, idx) => (
            <tr key={idx}>
              <td className="je-exp-item">{e.item}</td>
              <td className="je-exp-planned">{e.planned || '-'}</td>
              <td>
                <input
                  type="text"
                  className="je-exp-input"
                  placeholder="¥ 实际花费"
                  value={e.actual || ''}
                  onChange={ev => update(idx, 'actual', ev.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
