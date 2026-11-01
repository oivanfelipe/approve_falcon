// Which post formats need a caption before the art can go to the client.
// Reels, Feed and Carrossel always carry one; Stories usually don't.
export function isCaptionRequired(format?: string | null): boolean {
  return !/stor(y|ies)/i.test(format ?? "");
}
