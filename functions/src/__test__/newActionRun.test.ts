import {Request, Response} from "firebase-functions";
import {newActionRun} from "..";

jest.mock("../config/firebase.config");
jest.mock("../utils/githubUtils");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {firestore} = require("../config/firebase.config");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {isGithubActionsAddress} = require("../utils/githubUtils");
describe("newActionRun tests", () => {
  isGithubActionsAddress.mockImplementation(async (ip: string) => {
    const authorizedIps = ["1.2.3.4", "1:2:3:4:5:6:7:8"];
    return authorizedIps.includes(ip);
  });

  test("It should insert the right data with timestamp from an authorized IP", async () => {
    let collectionName = "";
    let addedData: any = {};
    let returnedStatus = 0;

    const addMock = jest.fn(async (data: any) => {
      addedData = data;
      return true;
    });

    const collection = jest.fn((cn: string) => {
      collectionName = cn;
      return {
        add: addMock,
      };
    });

    firestore.collection.mockImplementation(collection);

    const req = {
      method: "POST",
      ip: "1.2.3.4",
      body: {
        creator: "michmich112",
        github_action: "action",
        github_actor: "actor",
        github_base_ref: "base",
        github_head_ref: "head",
        github_ref: "ref",
        github_repository: "repository",
        github_run_id: "1",
        name: "action-name",
        runner_os: "Linux",
        version: "version_number",
      },
    };
    const res: unknown = {
      status: jest.fn((status: any) => {
        returnedStatus = status;
      }),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      end: jest.fn(() => { }),
    };
    await newActionRun(req as Request, res as Response);

    expect(returnedStatus).toBe(200);
    expect(addMock.mock.calls.length).toBe(1);
    expect(collectionName).toBe("runs");
    expect(addedData.timestamp).toMatch(/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z/gm);
    const timestamp = addedData.timestamp;
    expect(addedData).toEqual({
      ip: "1.2.3.4",
      ...req.body,
      timestamp,
    });
  });

  test("It should return null data if data sent is null but with timestamp and IP", async () => {
    let collectionName = "";
    let addedData: any = {};
    let returnedStatus = 0;

    const addMock = jest.fn(async (data: any) => {
      addedData = data;
      return true;
    });

    const collection = jest.fn((cn: string) => {
      collectionName = cn;
      return {
        add: addMock,
      };
    });

    firestore.collection.mockImplementation(collection);

    const req = {
      method: "POST",
      ip: "1.2.3.4",
      body: {
        creator: "michmich112",
        github_action: "action",
        github_actor: "actor",
        github_base_ref: null,
        github_head_ref: null,
        github_ref: "ref",
        github_repository: "repository",
        github_run_id: "3",
        name: "action-name",
        runner_os: "Linux",
        version: "version_number",
      },
    };
    const res: unknown = {
      status: jest.fn((status: any) => {
        returnedStatus = status;
      }),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      end: jest.fn(() => { }),
    };
    await newActionRun(req as Request, res as Response);

    expect(returnedStatus).toBe(200);
    expect(addMock.mock.calls.length).toBe(1);
    expect(collectionName).toBe("runs");
    expect(addedData.timestamp).toMatch(/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z/gm);
    const timestamp = addedData.timestamp;
    expect(addedData).toEqual({
      ip: "1.2.3.4",
      ...req.body,
      timestamp,
    });
  });

  test("it should save attempted runs from non-Github IPs", async () => {
    let collectionName = "";
    let addedData: any = {};
    let returnedStatus = 0;

    const addMock = jest.fn(async (data: any) => {
      addedData = data;
      return true;
    });

    const collection = jest.fn((cn: string) => {
      collectionName = cn;
      return {
        add: addMock,
      };
    });

    firestore.collection.mockImplementation(collection);

    const req = {
      method: "POST",
      ip: "0.0.0.69",
      body: {
        creator: "michmich112",
        github_action: "action",
        github_actor: "actor",
        github_base_ref: null,
        github_head_ref: null,
        github_ref: "ref",
        github_repository: "repository",
        github_run_id: "3",
        name: "action-name",
        runner_os: "Linux",
        version: "version_number",
      },
    };
    const res: unknown = {
      status: jest.fn((status: any) => {
        returnedStatus = status;
      }),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      end: jest.fn(() => { }),
    };
    await newActionRun(req as Request, res as Response);

    expect(returnedStatus).toBe(200);
    expect(addMock.mock.calls.length).toBe(1);
    expect(collectionName).toBe("attempted-runs");
    expect(addedData.run.timestamp).toMatch(/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z/gm);
    const timestamp = addedData.run.timestamp;
    expect(addedData).toEqual({
      run: {
        ip: "0.0.0.69",
        ...req.body,
        timestamp,
      },
      reason: "Attempted insertion from Non-Github IP: 0.0.0.69",
    });
  });

  test("it should block any request that is not POST", async () => {
    let returnedStatus = 0;

    const addMock = jest.fn(async (data: any) => {
      return true;
    });

    const collection = jest.fn((cn: string) => {
      return {
        add: addMock,
      };
    });

    firestore.collection.mockImplementation(collection);

    const req = {
      method: "GET",
      ip: "1.2.3.4",
      body: {
        creator: "michmich112",
        github_action: "action",
        github_actor: "actor",
        github_base_ref: null,
        github_head_ref: null,
        github_ref: "ref",
        github_repository: "repository",
        github_run_id: "3",
        name: "action-name",
        runner_os: "Linux",
        version: "version_number",
      },
    };
    const res: unknown = {
      status: jest.fn((status: any) => {
        returnedStatus = status;
      }),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      end: jest.fn(() => {}),
    };
    await newActionRun(req as Request, res as Response);

    expect(returnedStatus).toBe(405);
    expect(addMock.mock.calls.length).toBe(0);
  });
});

