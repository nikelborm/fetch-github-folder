export function logObjectNicely(item: any): void {
  console.dir(item, {
    colors: true,
    compact: false,
    depth: null,
  });
}
