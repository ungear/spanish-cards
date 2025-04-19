export function fileHandler(req, res) {
  res.write(req.url);
}