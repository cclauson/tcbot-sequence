import { ICodeLoader, IContainer, IFluidCodeDetails } from "@fluidframework/container-definitions";
import { Loader } from "@fluidframework/container-loader";
import { LocalDocumentServiceFactory, LocalResolver } from "@fluidframework/local-driver";
import { LocalDeltaConnectionServer } from "@fluidframework/server-local-server";

export class LocalDriver {
	private readonly urlResolver: LocalResolver;
	private readonly documentServiceFactory: LocalDocumentServiceFactory;
	private readonly codeLoader: ICodeLoader;

	constructor(codeLoader: ICodeLoader) {
        const localDeltaConnectionServer = LocalDeltaConnectionServer.create();
		this.urlResolver = new LocalResolver();
		this.documentServiceFactory = new LocalDocumentServiceFactory(localDeltaConnectionServer);
		this.codeLoader = codeLoader;
	}

	// Get a local Fluid container instance, either an existing instance, or a new instance,
	// depending on whether the name matches an existing container.
	// If a new container is provisioned, codeDetails will be used to initialize the container.
	public async getLocalContainer(containerName: string, codeDetails: IFluidCodeDetails): Promise<IContainer> {
		const loader = new Loader({
			codeLoader: this.codeLoader,
			urlResolver: this.urlResolver,
			documentServiceFactory: this.documentServiceFactory,
			scope: {},
			logger: null /* getECSState */
        });

		const container = await loader.createDetachedContainer(codeDetails);

		// Attach is optional, could make this a seperate method and call it explicitly if needed
		await container.attach(this.urlResolver.createCreateNewRequest(containerName));

		return container;
	}
}