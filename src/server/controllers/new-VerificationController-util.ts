import { Request } from "express";
import { isAddress } from "ethers/lib/utils";
import { toChecksumAddress } from "web3-utils";
import { ValidationError } from "../../common/errors";
import { FileArray, UploadedFile } from "express-fileupload";
import { CheckedContract } from "@ethereum-sourcify/lib-sourcify";
import { checkChainId } from "../../sourcify-chains";
import { validationResult } from "express-validator";

export type LegacyVerifyRequest = Request & {
  addresses: string[];
  chain: string;
  chosenContract: number;
  contextVariables?: {
    abiEncodedConstructorArguments?: string;
    msgSender?: string;
  };
};

type PathBuffer = {
  path: string;
  buffer: Buffer;
};

export const validateAddresses = (addresses: string): string[] => {
  const addressesArray = addresses.split(",");
  const invalidAddresses: string[] = [];
  for (const i in addressesArray) {
    const address = addressesArray[i];
    if (!isAddress(address)) {
      invalidAddresses.push(address);
    } else {
      addressesArray[i] = toChecksumAddress(address);
    }
  }

  if (invalidAddresses.length) {
    throw new Error(`Invalid addresses: ${invalidAddresses.join(", ")}`);
  }
  return addressesArray;
};

export const extractFiles = (req: Request, shouldThrow = false) => {
  if (req.is("multipart/form-data") && req.files && req.files.files) {
    return extractFilesFromForm(req.files.files);
  } else if (req.is("application/json") && req.body.files) {
    return extractFilesFromJSON(req.body.files);
  }

  if (shouldThrow) {
    throw new ValidationError([
      { param: "files", msg: "There should be files in the <files> field" },
    ]);
  }
};

const extractFilesFromForm = (
  files: UploadedFile | UploadedFile[]
): PathBuffer[] => {
  if (!Array.isArray(files)) {
    files = [files];
  }
  return files.map((f) => ({ path: f.name, buffer: f.data }));
};

const extractFilesFromJSON = (files: {
  [key: string]: string;
}): PathBuffer[] => {
  const inputFiles: PathBuffer[] = [];
  for (const name in files) {
    const file = files[name];
    const buffer = Buffer.isBuffer(file) ? file : Buffer.from(file);
    inputFiles.push({ path: name, buffer });
  }
  return inputFiles;
};

export const stringifyInvalidAndMissing = (contract: CheckedContract) => {
  const errors = Object.keys(contract.invalid).concat(
    Object.keys(contract.missing)
  );
  return `${contract.name} (${errors.join(", ")})`;
};

/**
 * Validation function for multiple chainIds
 * Note that this checks if a chain exists as a SourcifyChain.
 * This is different that checking for verification support i.e. supported: true or monitoring support i.e. monitored: true
 */
export const validateChainIds = (chainIds: string): string[] => {
  const chainIdsArray = chainIds.split(",");
  const validChainIds: string[] = [];
  const invalidChainIds: string[] = [];
  for (const chainId of chainIdsArray) {
    try {
      if (chainId === "0") {
        // create2 verified contract
        validChainIds.push("0");
      } else {
        validChainIds.push(checkChainId(chainId));
      }
    } catch (e) {
      invalidChainIds.push(chainId);
    }
  }

  if (invalidChainIds.length) {
    throw new Error(`Invalid chainIds: ${invalidChainIds.join(", ")}`);
  }
  return validChainIds;
};

export const validateRequest = (req: Request) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    throw new ValidationError(result.array());
  }
};
