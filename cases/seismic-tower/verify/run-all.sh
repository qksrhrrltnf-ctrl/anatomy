#!/bin/sh
# Builds both themes and runs every check; output goes to shots/verify-log.txt
cd "$(dirname "$0")/.."
S=../../scripts
{
node build.mjs && node build.mjs --light && node build.mjs --audit | tail -16
for f in seismic-tower-ko.html seismic-tower-ko-light.html; do
  echo "== $f"; node $S/lines.mjs $f --reduced | tail -2
  node $S/drive.mjs $f --actions verify/lines.json --reduced --height 1300 | grep "line ends\|console\|exception"
  node $S/capture.mjs $f --out shots/_cap.png --select .edu --height 1400 --scale 1 | tail -2
  node $S/capture.mjs $f --out shots/_cap390.png --select .edu --width 390 --scale 1 | tail -2
done
node $S/drive.mjs seismic-tower-ko.html --actions verify/keys.json --height 1300 | tail -5
node $S/drive.mjs seismic-tower-ko.html --actions verify/final-dark.json --height 1400 | grep -v "^shot\|^eval: 1"
node $S/drive.mjs seismic-tower-ko-light.html --actions verify/final-light.json --height 1400 | grep -v "^shot\|^eval: 1"
node $S/drive.mjs seismic-tower-ko.html --actions verify/phone-dark.json --width 390 --height 900 | tail -2
node $S/drive.mjs seismic-tower-ko-light.html --actions verify/phone-light.json --width 390 --height 900 | tail -2
} > shots/verify-log.txt 2>&1
