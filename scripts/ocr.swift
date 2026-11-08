import Vision
import AppKit
for path in CommandLine.arguments.dropFirst() {
  guard let img = NSImage(contentsOfFile: path), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
  let req = VNRecognizeTextRequest(); req.recognitionLevel = .accurate; req.usesLanguageCorrection = true
  try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
  print("[[\(URL(fileURLWithPath: path).lastPathComponent)]]")
  for o in (req.results ?? []) { if let t = o.topCandidates(1).first { print(t.string) } }
}
