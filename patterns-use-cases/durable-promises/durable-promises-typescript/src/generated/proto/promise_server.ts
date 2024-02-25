/* eslint-disable */
import _m0 from "protobufjs/minimal";
import { FileDescriptorProto as FileDescriptorProto1 } from "ts-proto-descriptors";
import { protoMetadata as protoMetadata1 } from "./dev/restate/ext";
import { Empty, protoMetadata as protoMetadata3 } from "./google/protobuf/empty";
import { protoMetadata as protoMetadata2, Value } from "./google/protobuf/struct";

export const protobufPackage = "";

export interface PromiseName {
  promiseName: string;
}

export interface ResolvePromise {
  promiseName: string;
  value: any | undefined;
}

export interface RejectPromise {
  promiseName: string;
  errorMessage: string;
}

export interface PromiseResult {
  promiseName: string;
  completed: boolean;
  value?: any | undefined;
  errorMessage?: string | undefined;
}

function createBasePromiseName(): PromiseName {
  return { promiseName: "" };
}

export const PromiseName = {
  encode(message: PromiseName, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.promiseName !== "") {
      writer.uint32(10).string(message.promiseName);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PromiseName {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePromiseName();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.promiseName = reader.string();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): PromiseName {
    return { promiseName: isSet(object.promiseName) ? String(object.promiseName) : "" };
  },

  toJSON(message: PromiseName): unknown {
    const obj: any = {};
    message.promiseName !== undefined && (obj.promiseName = message.promiseName);
    return obj;
  },

  create(base?: DeepPartial<PromiseName>): PromiseName {
    return PromiseName.fromPartial(base ?? {});
  },

  fromPartial(object: DeepPartial<PromiseName>): PromiseName {
    const message = createBasePromiseName();
    message.promiseName = object.promiseName ?? "";
    return message;
  },
};

function createBaseResolvePromise(): ResolvePromise {
  return { promiseName: "", value: undefined };
}

export const ResolvePromise = {
  encode(message: ResolvePromise, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.promiseName !== "") {
      writer.uint32(10).string(message.promiseName);
    }
    if (message.value !== undefined) {
      Value.encode(Value.wrap(message.value), writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ResolvePromise {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseResolvePromise();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.promiseName = reader.string();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.value = Value.unwrap(Value.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ResolvePromise {
    return {
      promiseName: isSet(object.promiseName) ? String(object.promiseName) : "",
      value: isSet(object?.value) ? object.value : undefined,
    };
  },

  toJSON(message: ResolvePromise): unknown {
    const obj: any = {};
    message.promiseName !== undefined && (obj.promiseName = message.promiseName);
    message.value !== undefined && (obj.value = message.value);
    return obj;
  },

  create(base?: DeepPartial<ResolvePromise>): ResolvePromise {
    return ResolvePromise.fromPartial(base ?? {});
  },

  fromPartial(object: DeepPartial<ResolvePromise>): ResolvePromise {
    const message = createBaseResolvePromise();
    message.promiseName = object.promiseName ?? "";
    message.value = object.value ?? undefined;
    return message;
  },
};

function createBaseRejectPromise(): RejectPromise {
  return { promiseName: "", errorMessage: "" };
}

export const RejectPromise = {
  encode(message: RejectPromise, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.promiseName !== "") {
      writer.uint32(10).string(message.promiseName);
    }
    if (message.errorMessage !== "") {
      writer.uint32(18).string(message.errorMessage);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): RejectPromise {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRejectPromise();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.promiseName = reader.string();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.errorMessage = reader.string();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): RejectPromise {
    return {
      promiseName: isSet(object.promiseName) ? String(object.promiseName) : "",
      errorMessage: isSet(object.errorMessage) ? String(object.errorMessage) : "",
    };
  },

  toJSON(message: RejectPromise): unknown {
    const obj: any = {};
    message.promiseName !== undefined && (obj.promiseName = message.promiseName);
    message.errorMessage !== undefined && (obj.errorMessage = message.errorMessage);
    return obj;
  },

  create(base?: DeepPartial<RejectPromise>): RejectPromise {
    return RejectPromise.fromPartial(base ?? {});
  },

  fromPartial(object: DeepPartial<RejectPromise>): RejectPromise {
    const message = createBaseRejectPromise();
    message.promiseName = object.promiseName ?? "";
    message.errorMessage = object.errorMessage ?? "";
    return message;
  },
};

function createBasePromiseResult(): PromiseResult {
  return { promiseName: "", completed: false, value: undefined, errorMessage: undefined };
}

export const PromiseResult = {
  encode(message: PromiseResult, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.promiseName !== "") {
      writer.uint32(10).string(message.promiseName);
    }
    if (message.completed === true) {
      writer.uint32(16).bool(message.completed);
    }
    if (message.value !== undefined) {
      Value.encode(Value.wrap(message.value), writer.uint32(90).fork()).ldelim();
    }
    if (message.errorMessage !== undefined) {
      writer.uint32(98).string(message.errorMessage);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PromiseResult {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePromiseResult();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.promiseName = reader.string();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.completed = reader.bool();
          continue;
        case 11:
          if (tag != 90) {
            break;
          }

          message.value = Value.unwrap(Value.decode(reader, reader.uint32()));
          continue;
        case 12:
          if (tag != 98) {
            break;
          }

          message.errorMessage = reader.string();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): PromiseResult {
    return {
      promiseName: isSet(object.promiseName) ? String(object.promiseName) : "",
      completed: isSet(object.completed) ? Boolean(object.completed) : false,
      value: isSet(object?.value) ? object.value : undefined,
      errorMessage: isSet(object.errorMessage) ? String(object.errorMessage) : undefined,
    };
  },

  toJSON(message: PromiseResult): unknown {
    const obj: any = {};
    message.promiseName !== undefined && (obj.promiseName = message.promiseName);
    message.completed !== undefined && (obj.completed = message.completed);
    message.value !== undefined && (obj.value = message.value);
    message.errorMessage !== undefined && (obj.errorMessage = message.errorMessage);
    return obj;
  },

  create(base?: DeepPartial<PromiseResult>): PromiseResult {
    return PromiseResult.fromPartial(base ?? {});
  },

  fromPartial(object: DeepPartial<PromiseResult>): PromiseResult {
    const message = createBasePromiseResult();
    message.promiseName = object.promiseName ?? "";
    message.completed = object.completed ?? false;
    message.value = object.value ?? undefined;
    message.errorMessage = object.errorMessage ?? undefined;
    return message;
  },
};

export interface durablePromiseServer {
  resolve(request: ResolvePromise): Promise<PromiseResult>;
  reject(request: RejectPromise): Promise<PromiseResult>;
  peek(request: PromiseName): Promise<PromiseResult>;
  await(request: PromiseName): Promise<PromiseResult>;
  dispose(request: PromiseName): Promise<Empty>;
}

export class durablePromiseServerClientImpl implements durablePromiseServer {
  private readonly rpc: Rpc;
  private readonly service: string;
  constructor(rpc: Rpc, opts?: { service?: string }) {
    this.service = opts?.service || "durablePromiseServer";
    this.rpc = rpc;
    this.resolve = this.resolve.bind(this);
    this.reject = this.reject.bind(this);
    this.peek = this.peek.bind(this);
    this.await = this.await.bind(this);
    this.dispose = this.dispose.bind(this);
  }
  resolve(request: ResolvePromise): Promise<PromiseResult> {
    const data = ResolvePromise.encode(request).finish();
    const promise = this.rpc.request(this.service, "resolve", data);
    return promise.then((data) => PromiseResult.decode(_m0.Reader.create(data)));
  }

  reject(request: RejectPromise): Promise<PromiseResult> {
    const data = RejectPromise.encode(request).finish();
    const promise = this.rpc.request(this.service, "reject", data);
    return promise.then((data) => PromiseResult.decode(_m0.Reader.create(data)));
  }

  peek(request: PromiseName): Promise<PromiseResult> {
    const data = PromiseName.encode(request).finish();
    const promise = this.rpc.request(this.service, "peek", data);
    return promise.then((data) => PromiseResult.decode(_m0.Reader.create(data)));
  }

  await(request: PromiseName): Promise<PromiseResult> {
    const data = PromiseName.encode(request).finish();
    const promise = this.rpc.request(this.service, "await", data);
    return promise.then((data) => PromiseResult.decode(_m0.Reader.create(data)));
  }

  dispose(request: PromiseName): Promise<Empty> {
    const data = PromiseName.encode(request).finish();
    const promise = this.rpc.request(this.service, "dispose", data);
    return promise.then((data) => Empty.decode(_m0.Reader.create(data)));
  }
}

interface Rpc {
  request(service: string, method: string, data: Uint8Array): Promise<Uint8Array>;
}

type ProtoMetaMessageOptions = {
  options?: { [key: string]: any };
  fields?: { [key: string]: { [key: string]: any } };
  oneof?: { [key: string]: { [key: string]: any } };
  nested?: { [key: string]: ProtoMetaMessageOptions };
};

export interface ProtoMetadata {
  fileDescriptor: FileDescriptorProto1;
  references: { [key: string]: any };
  dependencies?: ProtoMetadata[];
  options?: {
    options?: { [key: string]: any };
    services?: {
      [key: string]: { options?: { [key: string]: any }; methods?: { [key: string]: { [key: string]: any } } };
    };
    messages?: { [key: string]: ProtoMetaMessageOptions };
    enums?: { [key: string]: { options?: { [key: string]: any }; values?: { [key: string]: { [key: string]: any } } } };
  };
}

export const protoMetadata: ProtoMetadata = {
  fileDescriptor: FileDescriptorProto1.fromPartial({
    "name": "promise_server.proto",
    "package": "",
    "dependency": ["dev/restate/ext.proto", "google/protobuf/struct.proto", "google/protobuf/empty.proto"],
    "publicDependency": [],
    "weakDependency": [],
    "messageType": [{
      "name": "PromiseName",
      "field": [{
        "name": "promiseName",
        "number": 1,
        "label": 1,
        "type": 9,
        "typeName": "",
        "extendee": "",
        "defaultValue": "",
        "oneofIndex": 0,
        "jsonName": "promiseName",
        "options": undefined,
        "proto3Optional": false,
      }],
      "extension": [],
      "nestedType": [],
      "enumType": [],
      "extensionRange": [],
      "oneofDecl": [],
      "options": undefined,
      "reservedRange": [],
      "reservedName": [],
    }, {
      "name": "ResolvePromise",
      "field": [{
        "name": "promiseName",
        "number": 1,
        "label": 1,
        "type": 9,
        "typeName": "",
        "extendee": "",
        "defaultValue": "",
        "oneofIndex": 0,
        "jsonName": "promiseName",
        "options": undefined,
        "proto3Optional": false,
      }, {
        "name": "value",
        "number": 2,
        "label": 1,
        "type": 11,
        "typeName": ".google.protobuf.Value",
        "extendee": "",
        "defaultValue": "",
        "oneofIndex": 0,
        "jsonName": "value",
        "options": undefined,
        "proto3Optional": false,
      }],
      "extension": [],
      "nestedType": [],
      "enumType": [],
      "extensionRange": [],
      "oneofDecl": [],
      "options": undefined,
      "reservedRange": [],
      "reservedName": [],
    }, {
      "name": "RejectPromise",
      "field": [{
        "name": "promiseName",
        "number": 1,
        "label": 1,
        "type": 9,
        "typeName": "",
        "extendee": "",
        "defaultValue": "",
        "oneofIndex": 0,
        "jsonName": "promiseName",
        "options": undefined,
        "proto3Optional": false,
      }, {
        "name": "errorMessage",
        "number": 2,
        "label": 1,
        "type": 9,
        "typeName": "",
        "extendee": "",
        "defaultValue": "",
        "oneofIndex": 0,
        "jsonName": "errorMessage",
        "options": undefined,
        "proto3Optional": false,
      }],
      "extension": [],
      "nestedType": [],
      "enumType": [],
      "extensionRange": [],
      "oneofDecl": [],
      "options": undefined,
      "reservedRange": [],
      "reservedName": [],
    }, {
      "name": "PromiseResult",
      "field": [{
        "name": "promiseName",
        "number": 1,
        "label": 1,
        "type": 9,
        "typeName": "",
        "extendee": "",
        "defaultValue": "",
        "oneofIndex": 0,
        "jsonName": "promiseName",
        "options": undefined,
        "proto3Optional": false,
      }, {
        "name": "completed",
        "number": 2,
        "label": 1,
        "type": 8,
        "typeName": "",
        "extendee": "",
        "defaultValue": "",
        "oneofIndex": 0,
        "jsonName": "completed",
        "options": undefined,
        "proto3Optional": false,
      }, {
        "name": "value",
        "number": 11,
        "label": 1,
        "type": 11,
        "typeName": ".google.protobuf.Value",
        "extendee": "",
        "defaultValue": "",
        "oneofIndex": 0,
        "jsonName": "value",
        "options": undefined,
        "proto3Optional": false,
      }, {
        "name": "errorMessage",
        "number": 12,
        "label": 1,
        "type": 9,
        "typeName": "",
        "extendee": "",
        "defaultValue": "",
        "oneofIndex": 0,
        "jsonName": "errorMessage",
        "options": undefined,
        "proto3Optional": false,
      }],
      "extension": [],
      "nestedType": [],
      "enumType": [],
      "extensionRange": [],
      "oneofDecl": [{ "name": "result", "options": undefined }],
      "options": undefined,
      "reservedRange": [],
      "reservedName": [],
    }],
    "enumType": [],
    "service": [{
      "name": "durablePromiseServer",
      "method": [{
        "name": "resolve",
        "inputType": ".ResolvePromise",
        "outputType": ".PromiseResult",
        "options": { "deprecated": false, "idempotencyLevel": 0, "uninterpretedOption": [] },
        "clientStreaming": false,
        "serverStreaming": false,
      }, {
        "name": "reject",
        "inputType": ".RejectPromise",
        "outputType": ".PromiseResult",
        "options": { "deprecated": false, "idempotencyLevel": 0, "uninterpretedOption": [] },
        "clientStreaming": false,
        "serverStreaming": false,
      }, {
        "name": "peek",
        "inputType": ".PromiseName",
        "outputType": ".PromiseResult",
        "options": { "deprecated": false, "idempotencyLevel": 0, "uninterpretedOption": [] },
        "clientStreaming": false,
        "serverStreaming": false,
      }, {
        "name": "await",
        "inputType": ".PromiseName",
        "outputType": ".PromiseResult",
        "options": { "deprecated": false, "idempotencyLevel": 0, "uninterpretedOption": [] },
        "clientStreaming": false,
        "serverStreaming": false,
      }, {
        "name": "dispose",
        "inputType": ".PromiseName",
        "outputType": ".google.protobuf.Empty",
        "options": { "deprecated": false, "idempotencyLevel": 0, "uninterpretedOption": [] },
        "clientStreaming": false,
        "serverStreaming": false,
      }],
      "options": { "deprecated": false, "uninterpretedOption": [] },
    }],
    "extension": [],
    "options": {
      "javaPackage": "",
      "javaOuterClassname": "PromiseServerProto",
      "javaMultipleFiles": true,
      "javaGenerateEqualsAndHash": false,
      "javaStringCheckUtf8": false,
      "optimizeFor": 1,
      "goPackage": "",
      "ccGenericServices": false,
      "javaGenericServices": false,
      "pyGenericServices": false,
      "phpGenericServices": false,
      "deprecated": false,
      "ccEnableArenas": false,
      "objcClassPrefix": "",
      "csharpNamespace": "",
      "swiftPrefix": "",
      "phpClassPrefix": "",
      "phpNamespace": "",
      "phpMetadataNamespace": "",
      "rubyPackage": "",
      "uninterpretedOption": [],
    },
    "sourceCodeInfo": { "location": [] },
    "syntax": "proto3",
  }),
  references: {
    ".PromiseName": PromiseName,
    ".ResolvePromise": ResolvePromise,
    ".RejectPromise": RejectPromise,
    ".PromiseResult": PromiseResult,
    ".durablePromiseServer": durablePromiseServerClientImpl,
  },
  dependencies: [protoMetadata1, protoMetadata2, protoMetadata3],
  options: { services: { "durablePromiseServer": { options: { "service_type": 0 }, methods: {} } } },
};

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
