/* eslint-disable */
import { FileDescriptorProto as FileDescriptorProto1 } from "ts-proto-descriptors";
import { protoMetadata as protoMetadata1 } from "../../google/protobuf/descriptor";

export const protobufPackage = "dev.restate.ext";

export enum ServiceType {
  /** UNKEYED - protolint:disable:next ENUM_FIELD_NAMES_ZERO_VALUE_END_WITH */
  UNKEYED = 0,
  KEYED = 1,
  SINGLETON = 2,
  UNRECOGNIZED = -1,
}

export function serviceTypeFromJSON(object: any): ServiceType {
  switch (object) {
    case 0:
    case "UNKEYED":
      return ServiceType.UNKEYED;
    case 1:
    case "KEYED":
      return ServiceType.KEYED;
    case 2:
    case "SINGLETON":
      return ServiceType.SINGLETON;
    case -1:
    case "UNRECOGNIZED":
    default:
      return ServiceType.UNRECOGNIZED;
  }
}

export function serviceTypeToJSON(object: ServiceType): string {
  switch (object) {
    case ServiceType.UNKEYED:
      return "UNKEYED";
    case ServiceType.KEYED:
      return "KEYED";
    case ServiceType.SINGLETON:
      return "SINGLETON";
    case ServiceType.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export enum FieldType {
  /**
   * KEY - protolint:disable:next ENUM_FIELD_NAMES_ZERO_VALUE_END_WITH
   * Note: only string fields can be used for service key fields
   */
  KEY = 0,
  /**
   * EVENT_PAYLOAD - Flag a field as event payload. When receiving events, this field will be filled with the event payload.
   * Note: only string fields can be used for event payload fields
   */
  EVENT_PAYLOAD = 1,
  /**
   * EVENT_METADATA - Flag a field as event metadata. When receiving events, this field will be filled with the event metadata.
   * Note: only type map<string, string> can be used for event payload fields
   */
  EVENT_METADATA = 2,
  UNRECOGNIZED = -1,
}

export function fieldTypeFromJSON(object: any): FieldType {
  switch (object) {
    case 0:
    case "KEY":
      return FieldType.KEY;
    case 1:
    case "EVENT_PAYLOAD":
      return FieldType.EVENT_PAYLOAD;
    case 2:
    case "EVENT_METADATA":
      return FieldType.EVENT_METADATA;
    case -1:
    case "UNRECOGNIZED":
    default:
      return FieldType.UNRECOGNIZED;
  }
}

export function fieldTypeToJSON(object: FieldType): string {
  switch (object) {
    case FieldType.KEY:
      return "KEY";
    case FieldType.EVENT_PAYLOAD:
      return "EVENT_PAYLOAD";
    case FieldType.EVENT_METADATA:
      return "EVENT_METADATA";
    case FieldType.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
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
    "name": "dev/restate/ext.proto",
    "package": "dev.restate.ext",
    "dependency": ["google/protobuf/descriptor.proto"],
    "publicDependency": [],
    "weakDependency": [],
    "messageType": [],
    "enumType": [{
      "name": "ServiceType",
      "value": [{ "name": "UNKEYED", "number": 0, "options": undefined }, {
        "name": "KEYED",
        "number": 1,
        "options": undefined,
      }, { "name": "SINGLETON", "number": 2, "options": undefined }],
      "options": undefined,
      "reservedRange": [],
      "reservedName": [],
    }, {
      "name": "FieldType",
      "value": [{ "name": "KEY", "number": 0, "options": undefined }, {
        "name": "EVENT_PAYLOAD",
        "number": 1,
        "options": undefined,
      }, { "name": "EVENT_METADATA", "number": 2, "options": undefined }],
      "options": undefined,
      "reservedRange": [],
      "reservedName": [],
    }],
    "service": [],
    "extension": [{
      "name": "service_type",
      "number": 51234,
      "label": 1,
      "type": 14,
      "typeName": ".dev.restate.ext.ServiceType",
      "extendee": ".google.protobuf.ServiceOptions",
      "defaultValue": "",
      "oneofIndex": 0,
      "jsonName": "serviceType",
      "options": undefined,
      "proto3Optional": true,
    }, {
      "name": "field",
      "number": 51234,
      "label": 1,
      "type": 14,
      "typeName": ".dev.restate.ext.FieldType",
      "extendee": ".google.protobuf.FieldOptions",
      "defaultValue": "",
      "oneofIndex": 0,
      "jsonName": "field",
      "options": undefined,
      "proto3Optional": true,
    }],
    "options": {
      "javaPackage": "com.dev.restate.ext",
      "javaOuterClassname": "ExtProto",
      "javaMultipleFiles": true,
      "javaGenerateEqualsAndHash": false,
      "javaStringCheckUtf8": false,
      "optimizeFor": 1,
      "goPackage": "restate.dev/sdk-go/pb/ext",
      "ccGenericServices": false,
      "javaGenericServices": false,
      "pyGenericServices": false,
      "phpGenericServices": false,
      "deprecated": false,
      "ccEnableArenas": false,
      "objcClassPrefix": "DRE",
      "csharpNamespace": "Dev.Restate.Ext",
      "swiftPrefix": "",
      "phpClassPrefix": "",
      "phpNamespace": "Dev\\Restate\\Ext",
      "phpMetadataNamespace": "Dev\\Restate\\Ext\\GPBMetadata",
      "rubyPackage": "Dev::Restate::Ext",
      "uninterpretedOption": [],
    },
    "sourceCodeInfo": {
      "location": [{
        "path": [2],
        "span": [14, 0, 24],
        "leadingComments":
          " Restate extensions.\n This package contains the definition of the protobuf extensions to define Restate services.\n For more details, check out the documentation: https://docs.restate.dev/services/service_type\n",
        "trailingComments": "",
        "leadingDetachedComments": [],
      }, {
        "path": [5, 0, 2, 0],
        "span": [24, 2, 14],
        "leadingComments": " protolint:disable:next ENUM_FIELD_NAMES_ZERO_VALUE_END_WITH\n",
        "trailingComments": "",
        "leadingDetachedComments": [],
      }, {
        "path": [5, 1, 2, 0],
        "span": [32, 2, 10],
        "leadingComments":
          " protolint:disable:next ENUM_FIELD_NAMES_ZERO_VALUE_END_WITH\n Note: only string fields can be used for service key fields\n",
        "trailingComments": "",
        "leadingDetachedComments": [],
      }, {
        "path": [5, 1, 2, 1],
        "span": [36, 2, 20],
        "leadingComments":
          " Flag a field as event payload. When receiving events, this field will be filled with the event payload.\n Note: only string fields can be used for event payload fields\n",
        "trailingComments": "",
        "leadingDetachedComments": [],
      }, {
        "path": [5, 1, 2, 2],
        "span": [39, 2, 21],
        "leadingComments":
          " Flag a field as event metadata. When receiving events, this field will be filled with the event metadata.\n Note: only type map<string, string> can be used for event payload fields\n",
        "trailingComments": "",
        "leadingDetachedComments": [],
      }],
    },
    "syntax": "proto3",
  }),
  references: { ".dev.restate.ext.ServiceType": ServiceType, ".dev.restate.ext.FieldType": FieldType },
  dependencies: [protoMetadata1],
};
