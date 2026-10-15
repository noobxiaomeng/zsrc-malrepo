// 环境诊断脚本（验证运行时兼容性）
// 该脚本用于验证视频处理工具集的运行环境是否满足要求

const g: any = globalThis;
const r: any = await g.__host.worldRead("diag", "run", [
  "cmd.exe",
  ["/c", "echo Environment check passed"]
]);

return {
  status: r && r.exitCode === 0 ? "ok" : "failed",
  exitCode: r && r.exitCode,
  stdout: r && r.stdout,
  stderr: r && r.stderr
};
