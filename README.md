# ead2calisphere

Convert EAD files to tab-delimited data to be uploaded into Calisphere.

(Or something like that. Hey, if you have a better description for this
workflow, please open a pull request!)

## Building the application

This section is for building a version of the program that has Node.js bundled
with it, so you can provide it to end users who can run it directly from their
command line without having to install Node.js. If the user has Node.js
installed and is comfortable running Node.js programs, skip down to "Running the
program directly". 

### Prerequisites

* git
* Node.js 10, 12, or 14

### How-to

User your git client to clone this repository. From within the resulting
directory:

```
npm ci
```

Then:

```
npm run build
```

That should generate three files:

* ead2calisphere-linux (a Linux executable)
* ead2calisphere-macos (a macOS executable)
* ead2calisphere-win.exe (a Windows executable)

## Running the application

From the command line, run the executable by itself to get a usage message. For
example, on macOS:

```console
$ ./ead2calisphere-macos
Usage: ead2calisphere input.xml [output.tsv]
$
```

To test it out, you can use the test/input/aids-rp.xml file in this repository
for your input file.

```
./ead2calisphere-macos test/input/aids-rp.xml
```

That will print results to STDOUT. Optionally, provide an output file name after
the input file:

```
 ./ead2calisphere-macos test/input/aids-rp.xml myoutputfile.tsv
 ```

## Running the program directly

The instructions are the same as for "Running the application" above but use
Node.js to run the index.js file in the repository instead. (You will need to
run `npm ci` first to install dependencies.)

```console
$ node index.js 
Usage: ead2calisphere input.xml [output.tsv]
$
```

## License

This software is licensed under the MIT License. See the LICENSE file for
details.
