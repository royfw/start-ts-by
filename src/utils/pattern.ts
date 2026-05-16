// 只支援 user/project、user/project/subdir、user/project#branch、user/project#branch/subdir 等 github 風格
export const githubPattern = /^([\w.-]+)\/([\w.-]+)(\/[\w./_-]*)?$/;
