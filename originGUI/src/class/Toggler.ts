import Hack from "./Hack";




export default class Toggler extends Hack {
	enabled?: () => unknown;
	disabled?: () => unknown;
	constructor(
		public parent: HTMLDivElement,
		name?: string,
		description?: string
	) {
		super(parent, name, description);
		this.element.setAttribute("status", "false");
		this.migrateOldKey();
		this.setClick(async () => {
			this.status = !this.status;
			if (this.status) {
				localStorage.setItem(this.getStorageKey(), "true");
				await this.enabled?.();
			} else {
				localStorage.setItem(this.getStorageKey(), "false");
				await this.disabled?.();
			}
		});
	}

	private migrateOldKey(): void {
		const newKey = this.getStorageKey();
		if (this.name !== newKey && localStorage.getItem(this.name) !== null) {
			localStorage.setItem(newKey, localStorage.getItem(this.name)!);
			localStorage.removeItem(this.name);
		}
	}

	private getStorageKey(): string {
		// Try to get category name from parent's h1 header
		const categoryName = this.parent.querySelector("h1")?.innerText ?? "";
		// Namespace the key to avoid collisions between hacks with same name in different categories
		return categoryName ? `${categoryName}::${this.name}` : this.name;
	}

	get status() {
		return JSON.parse(this.element.getAttribute("status")!) as boolean;
	}

	set status(val) {
		this.element.setAttribute("status", val.toString());
	}

	setEnabled(event: () => unknown) {
		this.enabled = event;
		if (localStorage.getItem(this.getStorageKey()) === "true") {
			this.element.click();
		}
		return this;
	}

	setDisabled(event: () => unknown) {
		this.disabled = event;
		return this;
	}
}
