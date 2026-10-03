// CSS module type declarations for TypeScript
declare module '*.css' {
  const styles: Record<string, string>;
  export default styles;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

declare module '*.json' {
  const value: unknown;
  export default value;
}
