declare module 'snarkjs' {
  export namespace groth16 {
    export function fullProve(
      input: any,
      wasmFile: ArrayBuffer | string,
      zkeyFile: ArrayBuffer | string
    ): Promise<{
      proof: any;
      publicSignals: string[];
    }>;

    export function verify(
      vKey: any,
      publicSignals: string[],
      proof: any
    ): Promise<boolean>;
  }

  export namespace powersOfTau {
    export function newAccumulator(
      curve: any,
      power: number,
      logger?: any
    ): Promise<any>;
  }

  export namespace zKey {
    export function newZKey(
      r1cs: any,
      ptau: any,
      logger?: any
    ): Promise<any>;
  }
}

declare module 'circomlibjs' {
  export function buildPoseidon(): Promise<any>;
  export function buildMiMC7(): Promise<any>;
  export function buildBabyjub(): Promise<any>;
  export function buildEdDSA(): Promise<any>;
}

declare module 'crypto-js' {
  export namespace lib {
    export class WordArray {
      static random(nBytes: number): WordArray;
      toString(): string;
    }
  }
  
  export function SHA256(message: string): {
    toString(): string;
  };
  
  export function SHA512(message: string): {
    toString(): string;
  };
}

declare module 'fast-xml-parser' {
  export class XMLParser {
    constructor(options?: {
      ignoreAttributes?: boolean;
      attributeNamePrefix?: string;
      textNodeName?: string;
      parseAttributeValue?: boolean;
      trimValues?: boolean;
    });
    
    parse(xmlData: string): any;
  }
}