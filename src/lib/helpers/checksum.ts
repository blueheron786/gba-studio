import { createReadStream } from "fs-extra";
import crypto from "crypto";
import SparkMD5 from "spark-md5";

export const checksumFile = (path: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha1");
    const stream = createReadStream(path);
    stream.on("error", (err) => reject(err));
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
};

export const checksumMD5File = (path: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const spark = new SparkMD5.ArrayBuffer();
    const stream = createReadStream(path);
    stream.on("error", (err) => reject(err));
    stream.on("data", (chunk: string | Buffer) => {
      if (chunk instanceof Buffer) {
        const arrayBuffer = chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength) as ArrayBuffer;
        spark.append(arrayBuffer);
      }
    });
    stream.on("end", () => resolve(spark.end()));
  });
};

export const checksumString = (string: string): string => {
  const hash = crypto.createHash("sha1");
  hash.update(string);
  return hash.digest("hex");
};
