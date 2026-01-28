import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import terser from '@rollup/plugin-terser';

const external = [
  '@solana/web3.js',
  '@solana/wallet-adapter-base',
  '@coral-xyz/anchor',
  'snarkjs',
  'circomlibjs',
  'buffer',
  'bn.js'
];

export default [
  // ES Module build
  {
    input: 'src/index.ts',
    external,
    output: [
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      typescript({
        clean: true
      })
    ]
  },
  // CommonJS build
  {
    input: 'src/index.ts',
    external,
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: true
      }
    ],
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      typescript({
        clean: true
      })
    ]
  },
  // UMD build (minified)
  {
    input: 'src/index.ts',
    external,
    output: [
      {
        file: 'dist/index.umd.min.js',
        format: 'umd',
        name: 'SolsticeSDK',
        sourcemap: true,
        globals: {
          '@solana/web3.js': 'SolanaWeb3',
          '@solana/wallet-adapter-base': 'WalletAdapterBase',
          '@coral-xyz/anchor': 'Anchor',
          'snarkjs': 'snarkjs',
          'circomlibjs': 'circomlibjs',
          'buffer': 'Buffer',
          'bn.js': 'BN'
        }
      }
    ],
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      typescript({
        clean: true
      }),
      terser()
    ]
  }
];