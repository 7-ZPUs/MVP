import "reflect-metadata";
import * as path from "node:path";
import { container } from "tsyringe";

// Electron sets process.resourcesPath at runtime; set a deterministic value for node-based tests.
if (typeof (process as any).resourcesPath !== "string") {
	Object.defineProperty(process, "resourcesPath", {
		value: path.join(process.cwd(), "core", "src"),
		writable: true,
		configurable: true,
	});
}

// Default value used by DataMapper when tests don't set a specific DiP root.
if (!container.isRegistered("DIP_PATH_TOKEN")) {
	container.registerInstance("DIP_PATH_TOKEN", "");
}
