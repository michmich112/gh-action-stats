import { SQS } from "aws-sdk";
import {
  GetBadgeOperation,
  GetBadgeOperationErrorReturn,
  GetBadgeOperationParams,
  GetBadgeOperationRawReturn,
  GetBadgeOperationReturn,
  GetBadgeOperationUrlReturn,
} from "../../operations/MigrationGetBadgeOperation";

type LambdaResponse = {
  cookies?: string[];
  isBase64Encoded?: boolean;
  statusCode?: number;
  headers?: { [headerName: string]: string };
  body?: any;
};

// Built for AWS HTTP API Gateway (v2) (https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html).
// Event will be different for AWS REST API Gateway (v1)
export async function receiver(event: any): Promise<LambdaResponse> {
  const { queryStringParameters: queryParams, pathParameters } = event;

  //validate query params & path params?
  // getBadge
  let badge: GetBadgeOperationReturn | null;
  const operationParams: GetBadgeOperationParams = {
    creator: pathParameters.creator,
    name: pathParameters.name,
    metric: pathParameters.metric,
    params: queryParams,
  };
  try {
    badge = await GetBadgeOperation(operationParams);
  } catch (e) {
    console.error(
      `Unexpected Error encountered when getting badge with operation parameters: ${JSON.stringify(
        operationParams
      )}`,
      e
    );
    return { statusCode: 500 };
  }
  // Handle error
  if ((badge as GetBadgeOperationErrorReturn).err) {
    console.error(
      `Error encountered when getting the badge with operation parameters: ${JSON.stringify(
        operationParams
      )}`,
      (badge as GetBadgeOperationErrorReturn).err
    );
    return { statusCode: 500 };
  }

  // Send update badge request
  if (
    (badge as GetBadgeOperationRawReturn | GetBadgeOperationUrlReturn).outdated
  ) {
    if (!process.env.QUEUE_URL) {
      console.error(
        "No QUEUE_URL present for refresh badge requests. Unable to refresh badge."
      );
    } else {
      const sqs = new SQS();
      try {
        await sqs
          .sendMessage({
            QueueUrl: process.env.QUEUE_URL,
            MessageBody: JSON.stringify(operationParams),
          })
          .promise();
      } catch (e) {
        console.error(
          `Error sending refresh request to queue with url ${process.env.QUEUE_URL}, error:`,
          e
        );
      }
    }
  }

  if ((badge as GetBadgeOperationRawReturn).raw) {
    return {
      statusCode: 200,
      body: (badge as GetBadgeOperationRawReturn).raw,
      headers: {
        "content-type": "image/svg+xml",
      },
    };
  } else if ((badge as GetBadgeOperationUrlReturn).url) {
    return {
      statusCode: 302,
      headers: {
        location: (badge as GetBadgeOperationUrlReturn).url,
      },
    };
  } else {
    console.error(
      `Return from GetBadeOperation cannot be handled.\nParams: ${JSON.stringify(
        operationParams
      )}\nReturn:${JSON.stringify(badge)}`
    );
    return {
      statusCode: 404,
    };
  }
}
