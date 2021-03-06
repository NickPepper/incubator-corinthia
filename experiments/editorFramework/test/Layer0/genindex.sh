#!/bin/bash
(
prevdir=""
echo "// This file was generated by genindex.sh"
echo "var tests = [";
for dir in *; do
    if [ -d $dir ]; then
        if [ ! -z "$prevdir" ]; then
            echo ","
        fi
        echo "  { dir: \"$dir\","
        echo -n "    files: ["
        prevfile=""
        for file in $(cd $dir && echo *-input.html); do
            if [ ! -z "$prevfile" ]; then
                echo ","
                echo -n "            "
            fi
            shortname=`echo $file | sed -e 's/-input.html//'`
            echo -n "\"$shortname\""
            prevfile="$file"
        done
        echo -n "] }"
        prevdir="$dir"
    fi
done
echo
echo "];"
) > index.js
