import { createStylesheet } from './styling';
import { config, init } from './config';
import { styleTagStore, reloadStore } from './stores';
import { createCssClass, checkOptions, getRevealNode, createObserver, activateRevealNode } from './utils';
import type { IOptions, IReturnAction } from './types';

/**
 * Reveals a given node element on scroll
 * @param node - The DOM node you want to reveal on scroll
 * @param options - The custom options that will used to tweak the behavior of the animation of the node element
 * @returns An object containing update and/or destroy functions
 */
export const reveal = (node: HTMLElement, options: IOptions = init): IReturnAction => {
	const finalOptions = checkOptions(options);
	const {
		transition,
		disable,
		debug,
		ref,
		highlightLogs,
		highlightColor,
		onRevealStart,
		onMount,
		onUpdate,
		onDestroy
	} = finalOptions;

	const revealNode = getRevealNode(node);
	const className = createCssClass(ref, false, transition); // The CSS class responsible for the animation: ;
	const baseClassName = createCssClass(ref, true, transition); // The CSS class responsible for transitioning the properties

	onMount(revealNode);

	// Logging initial options and configurations info
	const canDebug = config.dev && debug && ref !== '';
	const highlightText = `color: ${highlightLogs ? highlightColor : '#B4BEC8'}`;

	if (canDebug) {
		console.groupCollapsed(`%cRef: ${ref}`, highlightText);

		console.groupCollapsed('%cNode', highlightText);
		console.log(revealNode);
		console.groupEnd();

		console.groupCollapsed('%cConfig', highlightText);
		console.log(config);
		console.groupEnd();

		console.groupCollapsed('%cOptions', highlightText);
		console.log(finalOptions);
		console.groupEnd();
	}

	// Checking if page was reloaded
	let reloaded = false;
	const unsubscribeReloaded = reloadStore.subscribe((value: boolean) => (reloaded = value));
	const navigation = window.performance.getEntriesByType('navigation');

	let navigationType: string | number = '';
	if (navigation.length > 0) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignoreq
		navigationType = navigation[0].type;
	} else {
		// Using deprecated navigation object as a last resort to detect a page reload
		navigationType = window.performance.navigation.type; // NOSONAR
	}
	if (navigationType === 'reload' || navigationType === 1) reloadStore.set(true);
	if (disable || (config.once && reloaded)) return {};

	// Setting up the styles
	let styleTagExists = false;
	const unsubscribeStyleTag = styleTagStore.subscribe((value: boolean) => (styleTagExists = value));

	if (!styleTagExists) {
		createStylesheet();
		styleTagStore.set(true);
	}

	onRevealStart(revealNode);
	activateRevealNode(revealNode, className, baseClassName, finalOptions);

	const ObserverInstance = createObserver(canDebug, highlightText, revealNode, finalOptions, className);
	ObserverInstance.observe(revealNode);

	console.groupEnd();

	return {
		update() {
			onUpdate(revealNode);
		},

		destroy() {
			onDestroy(revealNode);
			unsubscribeStyleTag();
			unsubscribeReloaded();
		}
	};
};