
import { defineStorage } from '@aws-amplify/backend-storage';

/**
 * Define an S3-backed storage resource for the Amplify backend.
 *
 * This minimal configuration creates a bucket named using the friendly
 * `name` below. Adjust `name`, `versioned`, `triggers`, and `access`
 * according to your app's requirements. See:
 * https://docs.amplify.aws/gen2/build-a-backend/storage/
 */
export const storage = defineStorage({
	// Friendly name used to derive the S3 bucket name. Change as desired.
	name: 'media',
	// Enable S3 versioning if your app requires object versioning.
	versioned: false,
	// Optionally add `access` rules here to grant read/write/delete to
	// authenticated/guest users or other backend resources.
});

export default storage;
