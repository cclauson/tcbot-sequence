import { ContainerRuntimeFactoryWithDefaultDataStore } from "@fluidframework/aqueduct";
import { TextEditorComponent } from "./TextEditorComponent";

export const TextEditorContainerRuntimeFactory = new ContainerRuntimeFactoryWithDefaultDataStore(
	TextEditorComponent.factory, // Default data object type
	new Map([TextEditorComponent.factory.registryEntry]) // Fluid object registry
);
