#!/usr/bin/env node

const program = require("commander");
const { constants, promises: fs } = require("fs");
const path = require("path");
const { inject } = require("./api.js");

async function main(filename, resourceName, resource, options) {
  if (options.outputApiHeader) {
    // Handles --output-api-header.
    console.log(
      await fs.readFile(path.join(__dirname, "postject-api.h"), "utf-8")
    );
    process.exit();
  }

  let resourceData;

  try {
    await fs.access(resource, constants.R_OK);
    resourceData = await fs.readFile(resource);
  } catch {
    console.log("Can't read resource file");
    process.exit(1);
  }

  try {
    await inject(filename, resourceName, resourceData, {
      machoSegmentName: options.machoSegmentName,
      overwrite: options.overwrite,
      sentinelFuse: options.sentinelFuse,
    });
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  program
    .name("postject")
    .description(
      "Inject arbitrary read-only resources into an executable for use at runtime"
    )
    .argument("<filename>", "The executable to inject into")
    .argument(
      "<resource_name>",
      "The resource name to use (section name on Mach-O and ELF, resource name for PE)"
    )
    .argument("<resource>", "The resource to inject")
    .option(
      "--macho-segment-name <segment_name>",
      "Name for the Mach-O segment",
      "__POSTJECT"
    )
    .option(
      "--sentinel-fuse <sentinel_fuse>",
      "Sentinel fuse for resource presence detection",
      "POSTJECT_SENTINEL_fce680ab2cc467b6e072b8b5df1996b2"
    )
    .option("--output-api-header", "Output the API header to stdout")
    .option("--overwrite", "Overwrite the resource if it already exists")
    .action(main)
    .parse(process.argv);
}
