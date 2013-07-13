#!/bin/bash

NAME=TabProject
KEY=~/secure/$NAME.pem
FILES=(*.html *.png *.json)
DIRS=(lib js css img)

if [ ! -d cext ]
then
	echo "Must be in the same directory as build.sh!"
	exit 1
fi

ROOTDIR=`pwd -P`

TMPDIR=`mktemp -d`

cd cext
for i in "${FILES[@]}"
do
	cp $i $TMPDIR/
done
for i in "${DIRS[@]}"
do
	cp -r "$i" "$TMPDIR/$i"
done


google-chrome --no-message-box --pack-extension=$TMPDIR --pack-extension-key=$KEY
rm -f libpeerconnection.log
mv $TMPDIR.crx $ROOTDIR/$NAME.crx
echo "Created $ROOTDIR/$NAME.crx"

cd $TMPDIR
zip -qr9X $ROOTDIR/$NAME.zip *
echo "Created $ROOTDIR/$NAME.zip"

cd $ROOTDIR
rm -rf $TMPDIR

echo "Finished."
