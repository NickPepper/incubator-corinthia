#!/usr/local/bin/phantomjs --web-security=no

// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

var autoGeneratedMsg = "// This file was automatically generated using schemas/generate.sh. "+
                       "Do not edit.";

var fs = require("fs");

// List of namespaces that we actually deal with in the conversion process
// To minimise size of lookup hash table we only include elements & attributes in
// the namespaces we need
var includeNamespaces = {
    "http://www.w3.org/XML/1998/namespace": true,
    "http://www.w3.org/1999/xhtml": true,
    "http://schemas.openxmlformats.org/markup-compatibility/2006": true,
    "http://schemas.openxmlformats.org/wordprocessingml/2006/main": true,
    "urn:oasis:names:tc:opendocument:xmlns:office:1.0": true,
    "urn:oasis:names:tc:opendocument:xmlns:style:1.0": true,
    "urn:oasis:names:tc:opendocument:xmlns:table:1.0": true,
    "urn:oasis:names:tc:opendocument:xmlns:text:1.0": true,
    "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0": true,
    "http://relaxng.org/ns/structure/1.0": true,
    "http://schemas.openxmlformats.org/package/2006/relationships": true,
    "http://schemas.openxmlformats.org/package/2006/content-types": true,
    "http://purl.org/dc/elements/1.1/": true,
    "urn:oasis:names:tc:opendocument:xmlns:meta:1.0": true,
    "http://www.uxproductivity.com/schemaview": true,
    "urn:oasis:names:tc:opendocument:xmlns:manifest:1.0": true,
    "http://schemas.openxmlformats.org/officeDocument/2006/math": true,
    "http://schemas.openxmlformats.org/schemaLibrary/2006/main": true,
    "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing": true,
    "http://schemas.openxmlformats.org/drawingml/2006/main": true,
    "http://schemas.openxmlformats.org/drawingml/2006/picture": true,
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships": true,
    "http://www.uxproductivity.com/uxwrite/conversion": true,
    "http://www.uxproductivity.com/uxwrite/LaTeX": true,
    "urn:schemas-microsoft-com:vml": true,
    "urn:schemas-microsoft-com:office:office": true,
    "http://www.w3.org/1999/xlink": true,
    "": true,
};

var MINIMUM_TAG = 10;

function debug(str)
{
    console.log(str);
}

function pad(str,length)
{
    while (str.length < length)
        str += " ";
    return str;
}

function Namespace(xmlPrefix,definePrefix,namespaceURI)
{
    this.xmlPrefix = xmlPrefix;
    this.definePrefix = definePrefix;
    this.namespaceURI = namespaceURI;
}

function Tag(define,type,namespaceURI,localName)
{
    this.define = define;
    this.type = type;
    this.namespaceURI = namespaceURI;
    this.localName = localName;
}

var namespaceArray = new Array();
var namespacesByURI = new Object();
var tagsByDefine = new Object();
var tagArray = new Array();

function readNamespaces(filename)
{
    var data = fs.read(filename);
    var lines = data.split("\n");
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.match(/^\s*$/))
            continue;
        var parts = line.split(/,/);
        if (parts.length != 3)
            throw new Error("Invalid line: "+line);

        var xmlPrefix = parts[0];
        var definePrefix = parts[1].replace(/-/g,"_").toUpperCase();
        var namespaceURI = parts[2];

        if (namespacesByURI[namespaceURI] != null) {
            debug("Skipping duplicate namespace record for "+namespaceURI);
        }
        else {
            var namespace = new Namespace(xmlPrefix,definePrefix,namespaceURI);
            namespaceArray.push(namespace);
            namespacesByURI[namespaceURI] = namespace;
        }
    }
}

function readTags(filename)
{
    var data = fs.read(filename);
    var lines = data.split("\n");
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.charAt(0) == "#")
            continue;
        if (line.match(/^\s*$/))
            continue;
        var parts = line.split(/,/);
        if (parts.length < 3)
            throw new Error("Invalid line: "+line);

        var type = parts[0];
        var namespaceURI = parts[1];
        var localName = parts[2];
        var namespace = namespacesByURI[namespaceURI];
//        if (namespace == null)
//            throw new Error("No namespace ID for "+namespaceURI);
        var definePrefix = (namespace != null) ? namespace.definePrefix : "NULL";

        var defineLocalName = localName;
        if ((parts.length >= 4) && (parts[3].charAt(0) == "!")) {
            var defineLocalName = parts[3].substring(1);
            debug("localName = "+localName+", defineLocalName = "+defineLocalName);
            var define = definePrefix+"_"+defineLocalName.replace(/-/g,"_");
        }
        else {
            var define = definePrefix+"_"+defineLocalName.replace(/-/g,"_").toUpperCase();
        }

        if (((type == "element") || (type == "attribute")) && includeNamespaces[namespaceURI])
            tagsByDefine[define] = new Tag(define,type,namespaceURI,localName);
    }
}

function buildTagsArray()
{
    var defines = Object.getOwnPropertyNames(tagsByDefine).sort();
    for (var i = 0; i < defines.length; i++) {
        var define = defines[i];
        var tag = tagsByDefine[define];
        tagArray.push(tag);
    }
}


function printNamespaceHeader(output)
{
    output.push(autoGeneratedMsg);
    output.push("");
    output.push("#ifndef _DFXMLNamespaces_h");
    output.push("#define _DFXMLNamespaces_h");
    output.push("");
    output.push("enum {");
    output.push("    NAMESPACE_NULL,");
    for (var i = 0; i < namespaceArray.length; i++) {
        var namespace = namespaceArray[i];
        output.push("    NAMESPACE_"+namespace.definePrefix+",");
    }
    output.push("    PREDEFINED_NAMESPACE_COUNT");
    output.push("};");
    output.push("");
    output.push("typedef struct {");
    output.push("    const char *namespaceURI;");
    output.push("    const char *prefix;");
    output.push("} NamespaceDecl;");
    output.push("");
    output.push("typedef unsigned int NamespaceID;");
    output.push("");
    output.push("#ifndef NAMESPACE_C");
    output.push("extern const NamespaceDecl PredefinedNamespaces[PREDEFINED_NAMESPACE_COUNT];");
    output.push("#endif");
    output.push("");
    output.push("#endif");
}

function printNamespaceSource(output)
{
    output.push(autoGeneratedMsg);
    output.push("");
    output.push("#define NAMESPACE_C");
    output.push("#include \"DFXMLNamespaces.h\"");
    output.push("#include <stdio.h>");
    output.push("");
    output.push("const NamespaceDecl PredefinedNamespaces[PREDEFINED_NAMESPACE_COUNT] = {");
    output.push("    { NULL, NULL },");
    for (var i = 0; i < namespaceArray.length; i++) {
        var namespace = namespaceArray[i];
        output.push("    { "+JSON.stringify(namespace.namespaceURI)+
                    ", "+JSON.stringify(namespace.xmlPrefix)+" },");
    }
    output.push("};");
}

function printTagsHeader(output)
{
    output.push(autoGeneratedMsg);
    output.push("");
    output.push("#ifndef _DFXMLNames_h");
    output.push("#define _DFXMLNames_h");
    output.push("");
    output.push("enum {");
    output.push("    "+tagArray[0].define+" = "+MINIMUM_TAG+",");
    for (var i = 1; i < tagArray.length; i++) {
        var tag = tagArray[i];
        output.push("    "+tag.define+",");
    }
    output.push("    PREDEFINED_TAG_COUNT");
    output.push("};");
    output.push("");
    output.push("typedef struct {");
    output.push("    unsigned int namespaceID;");
    output.push("    const char *localName;");
    output.push("} TagDecl;");
    output.push("");
    output.push("typedef unsigned int Tag;");
    output.push("");
    output.push("#ifndef TAGS_C");
    output.push("extern const TagDecl PredefinedTags[PREDEFINED_TAG_COUNT];");
    output.push("#endif");
    output.push("");
    output.push("#endif");
}

function printTagsSource(output)
{
    output.push(autoGeneratedMsg);
    output.push("");
    output.push("#define TAGS_C");
    output.push("#include \"DFXMLNames.h\"");
    output.push("#include \"DFXMLNamespaces.h\"");
    output.push("#include <stdio.h>");
    output.push("");
    output.push("const TagDecl PredefinedTags[PREDEFINED_TAG_COUNT] = {");
    for (var i = 0; i < MINIMUM_TAG; i++) {
        output.push("    { 0, NULL },");
    }
    for (var i = 0; i < tagArray.length; i++) {
        var tag = tagArray[i];
        var namespace = namespacesByURI[tag.namespaceURI];
//        if (namespace == null)
//            throw new Error("No namespace ID for "+tag.namespaceURI);
        var definePrefix = (namespace != null) ? namespace.definePrefix : "NULL";
        output.push("    { NAMESPACE_"+definePrefix+", "+
                    JSON.stringify(tag.localName)+" },");
    }
    output.push("};");
}

function printLookupHeader(output)
{
    output.push("typedef struct TagMapping {");
    output.push("  const char *name;");
    output.push("  unsigned int tag;");
    output.push("} TagMapping;");
    output.push("");
    output.push("const TagMapping *TagLookup(const char *str, unsigned int len);");
}

function printLookupGperf(output)
{
    output.push("%{");
    output.push("#include \"DFXMLNames.h\"");
    output.push("#include \"taglookup.h\"");
    output.push("#include <string.h>");
    output.push("%}");
    output.push("%readonly-tables");
    output.push("%define lookup-function-name TagLookup");
    output.push("%struct-type");
    output.push("struct TagMapping;");
    output.push("%%");
    for (var i = 0; i < tagArray.length; i++) {
        var tag = tagArray[i];
//        var namespace = namespacesByURI[tag.namespaceURI];
//        if (namespace == null)
//            throw new Error("No namespace ID for "+tag.namespaceURI);
        var combined = tag.localName+" "+tag.namespaceURI;
        output.push(combined+", "+tag.define);
    }
    output.push("%%");
}

function writeFile(filename,fun)
{
    var output = new Array();
    fun(output);
    output.push("");
    fs.write(filename,output.join("\n"),"w");
    debug("Wrote "+filename);
}

function main()
{
    try {
        var outputDir = "../DocFormats/names";

        readNamespaces("namespaces.csv");

        var filenames = ["output/collated.csv", "HTML5/html5.csv", "extra.csv"];
        for (var i = 0; i < filenames.length; i++)
            readTags(filenames[i]);
        buildTagsArray();

        writeFile(outputDir+"/DFXMLNamespaces.h",printNamespaceHeader);
        writeFile(outputDir+"/DFXMLNamespaces.c",printNamespaceSource);
        writeFile(outputDir+"/DFXMLNames.h",printTagsHeader);
        writeFile(outputDir+"/DFXMLNames.c",printTagsSource);
//        writeFile(outputDir+"/taglookup.h",printLookupHeader);
//        writeFile(outputDir+"/taglookup.gperf",printLookupGperf);

        phantom.exit(0);
    }
    catch (e) {
        debug("Error: "+e);
        phantom.exit(1);
    }
}

main();
