/* 跟随 x2ya.com 的暗色设置
 * 主站把主题存在 localStorage 的 x2ya-theme（'dark' / 'light'），
 * 并在 <html> 上切 .dark 类。这里读同一个键，让精油库跟随主站，不另起一套。
 * 无记录时跟随系统偏好。必须同步加载（放在 <head> 里 styles.css 之前），否则会闪一下白底。
 */
(function () {
  try {
    var saved = localStorage.getItem("x2ya-theme");
    var dark = saved
      ? saved === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {
    /* 隐私模式下 localStorage 不可用，忽略即可，保持浅色 */
  }
})();
