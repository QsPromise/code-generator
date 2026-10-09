/**
 * 接口文档解析与 API 代码生成辅助（共享）
 * 支持 OpenAPI paths 结构，或简单格式 { endpoints: [{ name, method, path, description }] }
 */
import fs from 'fs';
import path from 'path';

export const parseApiDoc = (raw) => {
  const doc = JSON.parse(raw);
  const endpoints = [];
  if (Array.isArray(doc.endpoints)) {
    for (const e of doc.endpoints) {
      if (e && e.method && e.path) {
        endpoints.push({
          name: e.name || '',
          method: String(e.method).toUpperCase(),
          path: e.path,
          description: e.description || ''
        });
      }
    }
  } else if (doc.paths && typeof doc.paths === 'object') {
    for (const [p, ops] of Object.entries(doc.paths)) {
      for (const [m, op] of Object.entries(ops || {})) {
        endpoints.push({
          name: op?.operationId || '',
          method: m.toUpperCase(),
          path: p,
          description: op?.summary || op?.description || ''
        });
      }
    }
  }
  return endpoints;
};

export const camel = (s) =>
  s
    .replace(/[^a-zA-Z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^([A-Z])/, (c) => c.toLowerCase());

// 将接口端点加工为模板可用的渲染数据（函数名、路径参数、签名等）
export const enrichEndpoint = (e) => {
  if (!e) return null;
  const params = [];
  const url = e.path
    .replace(/\{(\w+)\}/g, (_, p) => {
      params.push(p);
      return `\${${p}}`;
    })
    .replace(/:(\w+)/g, (_, p) => {
      params.push(p);
      return `\${${p}}`;
    });
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(e.method);
  const fnName = camel(e.name || `${e.method.toLowerCase()}-${e.path}`);
  const signatureParts = params.map((p) => `${p}: string`);
  if (hasBody) signatureParts.push('payload: Record<string, unknown>');
  return {
    ...e,
    fnName,
    responseType: fnName.charAt(0).toUpperCase() + fnName.slice(1) + 'Response',
    url,
    params,
    signature: signatureParts.join(', '),
    callArg: hasBody ? ', payload' : '',
    callParams: params.join(', ') || '/* TODO: runId */',
    methodLower: e.method.toLowerCase()
  };
};

// 缓存已解析的接口文档，避免 choices 函数反复读文件
let docCache = { key: null, endpoints: [] };
export const getEndpoints = (answers) => {
  const key =
    answers.apiDocSource === 'path'
      ? `path:${answers.apiDocPath}`
      : `json:${answers.apiDocJson}`;
  if (docCache.key !== key) {
    try {
      const raw =
        answers.apiDocSource === 'path'
          ? fs.readFileSync(path.resolve(answers.apiDocPath), 'utf-8')
          : answers.apiDocJson;
      docCache = { key, endpoints: parseApiDoc(raw) };
    } catch {
      docCache = { key, endpoints: [] };
    }
  }
  return docCache.endpoints;
};

export const endpointChoice = (e) => ({
  name: `${e.method} ${e.path}${e.description ? ` — ${e.description}` : ''}`,
  value: e
});

export const validateApiDoc = (raw) => {
  try {
    const endpoints = parseApiDoc(raw);
    return endpoints.length > 0 ? true : '❌ 未解析到任何接口';
  } catch (err) {
    return `❌ JSON 解析失败：${err.message}`;
  }
};
