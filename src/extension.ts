import GLib from 'gi://GLib';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

type CompositorMethod = (...args: unknown[]) => void;

type CompositorApi = {
    [name: string]: unknown;
};

type EnableMethodName = 'enable_unredirect' | 'enable_unredirect_for_display';

type UnredirectApi = {
    compositor: CompositorApi;
    disable: () => void;
    enableArguments: unknown[];
    enableMethodName: EnableMethodName;
};

type EnablePatch = {
    api: UnredirectApi;
    original: CompositorMethod;
    replacement: CompositorMethod;
};

function isCompositorMethod(value: unknown): value is CompositorMethod {
    return typeof value === 'function';
}

function resolveUnredirectApi(): UnredirectApi | null {
    const compositor = global.compositor as unknown as CompositorApi;
    const disable = compositor.disable_unredirect;
    const enable = compositor.enable_unredirect;

    if (isCompositorMethod(disable) && isCompositorMethod(enable)) {
        return {
            compositor,
            disable: () => disable.call(compositor),
            enableArguments: [],
            enableMethodName: 'enable_unredirect',
        };
    }

    const legacyDisable = compositor.disable_unredirect_for_display;
    const legacyEnable = compositor.enable_unredirect_for_display;

    if (isCompositorMethod(legacyDisable) && isCompositorMethod(legacyEnable)) {
        return {
            compositor,
            disable: () => legacyDisable.call(compositor, global.display),
            enableArguments: [global.display],
            enableMethodName: 'enable_unredirect_for_display',
        };
    }

    return null;
}

export default class DisableUnredirectExtension extends Extension {
    #disableSourceId: number | null = null;

    #enablePatch: EnablePatch | null = null;

    enable() {
        if (this.#enablePatch !== null) {
            return;
        }

        const api = resolveUnredirectApi();

        if (api === null) {
            console.error(
                'Disable Unredirect: no supported compositor unredirect API was found.',
            );
            return;
        }

        const original = api.compositor[api.enableMethodName];

        if (!isCompositorMethod(original)) {
            console.error(
                'Disable Unredirect: the compositor enable API disappeared before it could be patched.',
            );
            return;
        }

        const replacement: CompositorMethod = () => {
            console.debug(
                'Disable Unredirect: ignored compositor enable request.',
            );
        };

        api.compositor[api.enableMethodName] = replacement;
        this.#enablePatch = {api, original, replacement};
        this.#disableSourceId = GLib.idle_add(
            GLib.PRIORITY_DEFAULT_IDLE,
            () => {
                this.#disableSourceId = null;
                this.#disableUnredirect();
                return GLib.SOURCE_REMOVE;
            },
        );
    }

    disable() {
        this.#cancelPendingDisable();

        const patch = this.#enablePatch;
        this.#enablePatch = null;

        if (patch === null) {
            return;
        }

        if (
            patch.api.compositor[patch.api.enableMethodName] ===
            patch.replacement
        ) {
            patch.api.compositor[patch.api.enableMethodName] = patch.original;
        }

        const enable = patch.api.compositor[patch.api.enableMethodName];

        if (isCompositorMethod(enable)) {
            enable.call(patch.api.compositor, ...patch.api.enableArguments);
        }
    }

    #cancelPendingDisable() {
        if (this.#disableSourceId === null) {
            return;
        }

        GLib.Source.remove(this.#disableSourceId);
        this.#disableSourceId = null;
    }

    #disableUnredirect() {
        const patch = this.#enablePatch;

        if (patch === null) {
            return;
        }

        try {
            patch.api.disable();
        } catch (error) {
            console.error(
                `Disable Unredirect: unable to disable unredirect: ${error}`,
            );
        }
    }
}
