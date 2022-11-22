import { SQS } from "aws-sdk";
import { CollectActionRun } from "../../operations/CollectActionRun";

type LambdaResponse = {
  cookies?: string[];
  isBase64Encoded?: boolean;
  statusCode?: number;
  headers?: { [headerName: string]: string };
  body?: any;
};

// Todo: strongly typed
export async function receiver(event: any): Promise<LambdaResponse | void> {
  const ip = event["requestContext"]["http"]["sourceIp"];
  const body = {
    ip, // TODO fix this as per https://github.com/michmich112/gh-action-stats/issues/51
    ...JSON.parse(event.body),
    timestamp: new Date().toISOString(),
  };

  if (!process.env.QUEUE_URL) {
    console.error("No QUEUE_URL found. Body:", body);
    return {
      statusCode: 200,
    };
  }

  const sqs = new SQS();

  try {
    await sqs
      .sendMessage({
        QueueUrl: process.env.QUEUE_URL,
        MessageBody: JSON.stringify(body),
      })
      .promise();
  } catch (e) {
    console.error(
      `Error sending queue message, queue: ${process.env.QUEUE_URL}, error:`,
      e
    );
    return;
  }
  console.debug("SUCCESS");
}

export async function worker(event: any) {
  for (const message of event.Records) {
    try {
      await CollectActionRun(JSON.parse(message.body));
    } catch (e) {
      console.error(
        "CollectActionRun Operation Error.\nRun:",
        message.body,
        "\nError: ",
        e
      );
    }
  }
}
