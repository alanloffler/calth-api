import * as crypto from "crypto";
import { Injectable } from "@nestjs/common";

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor() {
    this.key = crypto.scryptSync(process.env.ENCRYPTION_KEY ?? "secret", "salt", 32);
  }

  encrypt(value: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", this.key, iv);
    const encrypted = Buffer.concat([cipher.update(value), cipher.final()]);
    return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
  }

  decrypt(encrypted: string): string {
    const [ivHex, encryptedHex] = encrypted.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", this.key, iv);
    return Buffer.concat([decipher.update(Buffer.from(encryptedHex, "hex")), decipher.final()]).toString();
  }
}
