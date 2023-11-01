import fs from 'fs';
import { getInput, setFailed, saveState, debug, info } from '@actions/core';
import { CloudFrontClient, CreateInvalidationCommand, GetDistributionConfigCommand, UpdateDistributionCommand } from '@aws-sdk/client-cloudfront';

const mainFn = async (): Promise<void> => {
    let originPath = getInput('ORIGIN_PATH', { required: true });
    const distributionId = getInput('AWS_DISTRIBUTION_ID', { required: true });
    const originPathIndex = parseInt(getInput('ORIGIN_PATH_INDEX') || '0');
    const awsRegion = getInput('AWS_REGION') || 'us-east-1';

    const awsS3Uri = process.env.AWS_S3_PATH;
    const folderPath = process.env.FOLDER_PATH;
    debug(`folderPath: ${folderPath}`);
    info(`AWS_ACCESS_KEY_ID: is defined? ${process.env.AWS_ACCESS_KEY_ID ? true : false}`)
    const errorList: string[] = [];
    if (!distributionId) {
        errorList.push('AWS_DISTRIBUTION_ID is required')
    }

    if (!originPath || !folderPath) {
        errorList.push('ORIGIN_PATH is required')
    }

    if (errorList.length > 0) {
        throw new Error(errorList.join('\n'));
    }

    if (awsS3Uri) {
        info(`main:awsS3Uri: ${awsS3Uri}`);
    }

    try {
        debug(`**** File List ****`);
        //joining path of directory 
        const directoryPath = './'
        //passsing directoryPath and callback function
        fs.readdir(directoryPath, (err: Error, files: string[]) => {
            //handling error
            if (err) { debug('Unable to scan directory: ' + err); }
            else {
                debug(`dir: ${process.cwd()}`);
                debug(files.join('\n'));
            }
            debug(`**** EOF File List ****`);
        });
    } catch (error) {
        debug(error);
    }

    const client = new CloudFrontClient({ region: awsRegion });

    const getDistributionConfigCmd = new GetDistributionConfigCommand({ Id: distributionId });
    const { DistributionConfig, ETag } = await client.send(getDistributionConfigCmd);

    const currentOriginPath = DistributionConfig.Origins.Items[originPathIndex].OriginPath;
    debug(`Current OriginPath: ${currentOriginPath}`);
    DistributionConfig.Origins.Items[originPathIndex].OriginPath = folderPath || originPath
    debug(`New OriginPath: ${folderPath || originPath}`);

    info(`Updating Distribution OriginPath of index ${originPathIndex}...`);
    const updateDistributionCmd = new UpdateDistributionCommand({
        DistributionConfig,
        Id: distributionId,
        IfMatch: ETag
    });

    const updateRes = await client.send(updateDistributionCmd);
    debug(`Update Distribution response statusCode: ${updateRes.$metadata.httpStatusCode}`);

    info(`Requesting distribution invalidation...`);
    const createInvalidationCmd = new CreateInvalidationCommand({
        DistributionId: distributionId,
        InvalidationBatch: {
            CallerReference: new Date().toISOString(),
            Paths: {
                Items: ['/*'],
                Quantity: 1
            }
        }
    });

    const invalidationRes = await client.send(createInvalidationCmd);
    debug(`Invalidation response statusCode: ${invalidationRes.$metadata.httpStatusCode}`);

    info("End of the job..");
};

mainFn()
    .then(() => {
        console.log('Done...');
        saveState('done', 'done');
    })
    .catch((err: Error) => {
        console.error(err)
        setFailed(err)
    });