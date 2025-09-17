declare module 'pdf-parse/lib/pdf-parse.js' {
  const pdfParse: (dataBuffer: Buffer | Uint8Array, options?: { password?: string }) => Promise<{ text: string }>
  export default pdfParse
}
