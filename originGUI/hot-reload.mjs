import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import http from "http";
import { buildBundle } from "./build.mjs";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const bundlePath = path.join(rootDir, "dist", "bundle.js");
const sourceDir = path.join(rootDir, "src");

const app = http.createServer();

const io = new Server(app, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	}
});

let rebuilding = false;
let needsRebuild = false;

async function rebuild () {
	if (rebuilding) {
		needsRebuild = true;
		return;
	}

	rebuilding = true;

	try {
		await buildBundle({ mode: "development" });
		const data = await fs.promises.readFile(bundlePath, "utf8");
		io.emit("update", data);
	} catch (error) {
		console.error(error);
	} finally {
		rebuilding = false;
		if (needsRebuild) {
			needsRebuild = false;
			void rebuild();
		}
	}
}

await rebuild();

fs.watch(sourceDir, { recursive: true }, () => {
	void rebuild();
});

app.listen(3001, () => console.log("Listening on port 3001"));
