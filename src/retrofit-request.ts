import * as request from "request-promise-native"

export var HTTP = function(baseURL: string) {
    return function(constructor: Function) {
        constructor.prototype["easyRequest_BaseURI"] = baseURL;
    }
}

export var GET = buildMethod("GET");
export var POST = buildMethod("POST");

export var Ajax = buildContentType("JSON", (options: any)=>{options["json"] = true;});
export var FormUrlEncoded = buildContentType("FormUrlEncoded", (options: any)=>{
    const body = options["body"];
    options["form"] = {};
    if (options && Object.keys(options).length > 0) {
        //not undfined, null or {}
        options["form"] = body;
        delete options.body;
    }
});
export var Multipart = buildContentType("Multipart", (options: any)=>{
    options["formData"] = {};
    const body = options["body"];
    options["formData"] = {};
    if (options && Object.keys(options).length > 0) {
        //not undfined, null or {}
        options["formData"] = body;
        delete options.body;
    }
});

export var Header = buildParam("Header");
export var Path = buildParam("Path");
export var Query = buildParam("Query");
export var Body = buildParamAsIs("Body");
export var Field = buildParam("Field");
export var Part = Field;

function buildContentType(type: string, installer: Function) {
    return function(targetClass: any, methodName: string, descriptor: PropertyDescriptor) {
        targetClass[`${methodName}_ContentType`] = installer;
    }
}

function buildParam(type: string) {
    return function(key: string, evaluator?: Function) {
        return function (targetClass: any, methodName: string | symbol, parameterIndex: number) {
            let metadataKey = `${String(methodName)}_${type}_params`;
            var paramObj = {
                key: key,
                eval: evaluator,
                index: parameterIndex
            }

            targetClass[metadataKey] = (targetClass[metadataKey] || []).concat(paramObj);
        }
    }
}

function buildParamAsIs(type: string) {
    return function (targetClass: any, methodName: string | symbol, parameterIndex: number) {
        let metadataKey = `${String(methodName)}_${type}_params`;
        var paramObj = {
            index: parameterIndex
        }
        targetClass[metadataKey] = (targetClass[metadataKey] || []).concat(paramObj);
    } 
}

function buildMethod(method: string) {
    return function(uri: string, custom?: {timeout:number}) {
        return function(targetClass: any, methodName: string, descriptor: PropertyDescriptor) {
            // let is_static = (typeof target === 'function');
            let _paths = targetClass[`${methodName}_Path_params`] as Array<{key: string, index: number}>;
            let _querys = targetClass[`${methodName}_Query_params`] as Array<{key: string, index: number}>;
            let _bodys = targetClass[`${methodName}_Body_params`] as Array<{key: string, index: number}>;
            let _headers = targetClass[`${methodName}_Header_params`] as Array<{key: string, index: number}>;
            let _contentType = targetClass[`${methodName}_ContentType`] as Function;
            let _fields = targetClass[`${methodName}_Field_params`] as Array<{key: string, index: number}>;
            /** 
             * retrieve annoted elements from argument at runtime
            */
            function resolve_from_args(metas: any[], args: any[]): {} {
                return metas.reduce((r, c)=>(r[c.key]=c.eval?c.eval(args[c.index]):args[c.index],r), {});
            }

            function resolve_from_args_asis(metas: any[], args: any[]): {} {
                return metas.reduce((r, c)=>({...r, ...args[c.index]}), {});
            }

            function substitute(uri: string, metas: any): string {
                var ret = uri;
                Object.keys(metas).forEach(key =>{
                    ret = ret.replace(`{${key}}`, metas[key])
                });
                return ret;
            }

            let path_composite = (function(){
                function composite_iter(first: boolean, ...parts: string[]): any {
                    if (parts.length == 0) return "";
                    var head = parts[0];
                    //remove the tailing '/' if exists
                    head = head[head.length-1] === "/" ? head.substring(0, head.length-1) : head;
                    //add leading '/' if not exists
                    let rest = parts.slice(1);
                    return head[0] === "/" ? head + composite_iter(false, ...rest) : first ? head + composite_iter(false, ...rest) : `/${head}`+composite_iter(false, ...rest);
                }
                return function(...parts: string[]) {
                    return composite_iter(true, ...parts) as string;
                }
            }());

            descriptor.value = async function (...args: any[]) {
                let paths = _paths && resolve_from_args(_paths, args);
                let querys = _querys && resolve_from_args(_querys, args);
                let headers = _headers && resolve_from_args(_headers, args);
                let bodys = _bodys && resolve_from_args_asis(_bodys, args);
                let fields = _fields && resolve_from_args(_fields, args);

                uri = (paths && substitute(uri, paths)) || uri;
                let _baseuri = targetClass[`easyRequest_BaseURI`] || targetClass.prototype["easyRequest_BaseURI"] || "";

                const options = {
                    timeout: 10000,
                    method: method,
                    qs: querys,
                    body: {...bodys, ...fields},
                    uri: path_composite(_baseuri, uri),
                    headers: headers,
                    ...custom
                };

                if (_contentType) {
                    _contentType(options);
                }

                return await request(options);
            }
        }
    }
}