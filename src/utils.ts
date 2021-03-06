import { assert } from 'console';
import {Error, ErrorType} from './error';


export const isString = (arg: any) : arg is string => {
  if(typeof arg == "string") {
    return true;
  }
  return false;
}

export const validateArgument = (
  obj: any,
  validKeys: string[],
  expectedTypes: string[],
  mustBePresent: boolean[]
) => {
  assert(validKeys.length === expectedTypes.length);
  assert(validKeys.length === mustBePresent.length);
  assert(expectedTypes.length === mustBePresent.length);
  
  if (obj == undefined || obj == null) {
    throw new Error(
      400,
      ErrorType.INVALID_REQUEST,
      "missing request body", 
    )
  }

  // make sure that all mandatory keys are present in object
  mustBePresent.forEach((value, index) => {
    if (value == true) {
      let mandatoryKey = validKeys[index];
      let hasMandatoryKey = false;

      Object.keys(obj).forEach((key) => {
        if (key == mandatoryKey) {
          hasMandatoryKey = true;
        }
      });

      if (!hasMandatoryKey) {
        throw new Error(
          400,
          ErrorType.INVALID_REQUEST,
          "missing expected argument '" + mandatoryKey + "'"
        )
      }
    }
  });

  // make sure that all keys in object are valid and have the expected type
  Object.keys(obj).forEach((key) => {
    let isValidKey = false;
    let hasValidType = false;
    let expectedType = "";

    // iterate over valid keys
    for (var i = 0; i < validKeys.length; i++) {
      // if object key is valid
      if (key == validKeys[i]) {
        isValidKey = true;

        // check whether type of value is what we expected
        if (typeof obj[key] == expectedTypes[i]) {
          hasValidType = true;
        }
        expectedType = expectedTypes[i];
        break;
      }
    }

    if (!isValidKey) {
      throw new Error(
        400,
        ErrorType.INVALID_REQUEST,
        "argument " + key + " shouldn't be present"
      )
    }

    if (!hasValidType) {
      throw new Error(
        400,
        ErrorType.INVALID_REQUEST,
        "argument '" +
          key +
          "' has invalid type. Expected '" +
          expectedType +
          "'. Received '" +
          typeof obj[key] +
          "'."
      )
    }
  });
};
