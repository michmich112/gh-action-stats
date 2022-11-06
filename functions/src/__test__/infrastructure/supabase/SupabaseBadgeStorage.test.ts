import * as dotenv from "dotenv";
import { getClient } from "../../../infrastructure/supabase/SupabaseClient";
import { SupabaseClient } from "@supabase/supabase-js";
import BadgeStorage from "../../../infrastructure/supabase/storage/BadgeStorage";

const eut = "SupabaseBadgeStorage"; //element under test

function skip(client: any, repo: any, soft: boolean = false): boolean {
  if (!client || !repo) {
    if (soft) {
      console.warn(`[${eut}] - client or repo not initialized. Skipping tests`);
      return false;
    }
    throw new Error(
      `[${eut}] - client or repo not initialized. Cancelling tests`
    );
  }
  return true;
}

describe(`${eut} tests`, () => {
  let client: null | SupabaseClient = null;
  let repo: null | BadgeStorage = null;
  const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="50" />
  </svg>`;

  beforeAll(async () => {
    dotenv.config();
    try {
      client = getClient();
      repo = await BadgeStorage.New(client); // create new client

      const { error } = await client.storage.emptyBucket(
        repo?.bucketName ?? "badges"
      );
      if (error) {
        console.warn(
          `[${eut}] BeforeAll - error clearing storage bucket. Some tests might fail.`,
          error
        );
      }
    } catch (e) {
      console.error("Error initializing test.", e);
    }
  });

  beforeEach(async () => {
    skip(client, repo);
    // delete all from the bucket if there are files
    const { error } = await client!.storage.emptyBucket(
      repo?.bucketName ?? "badges"
    );
    if (error) {
      console.warn(
        `[${eut}] BeforeAll - error clearing storage bucket. Some tests might fail.`,
        error
      );
    }
  });

  describe("put", () => {
    test("it should succeed with any proper path", async function () {
      skip(client, repo);

      const { data: pre_data } = await client!.storage.from("badges").list();
      await repo!.put("test_1.svg", svg); // test no path
      await repo!.put("test/test_2.svg", svg); // test in single folder
      await repo!.put("test/put/test_3.svg", svg); // test compound path

      const { data: lvl1_data } = await client!.storage.from("badges").list();
      if (!pre_data || !lvl1_data) throw new Error("Data Not Returned");
      let fileNames = lvl1_data.map((f) => f.name);
      // supabase api returns only 1st depth files
      expect(lvl1_data.length).toEqual(pre_data.length + 2);
      expect(fileNames.includes("test_1.svg")).toBeTruthy();
      expect(fileNames.includes("test")).toBeTruthy(); // will include name of the folder

      const { data: lvl2_data } = await client!.storage
        .from("badges")
        .list("test");
      if (!lvl2_data) throw new Error("Level 2 data not returned");
      fileNames = lvl2_data.map((f) => f.name);
      expect(lvl2_data.length).toEqual(2);
      expect(fileNames.includes("test_2.svg")).toBeTruthy();
      expect(fileNames.includes("put")).toBeTruthy(); // will include name of the folder

      const { data: lvl3_data } = await client!.storage
        .from("badges")
        .list("test/put");
      if (!lvl3_data) throw new Error("Level 3 data not returned");
      fileNames = lvl3_data.map((f) => f.name);
      expect(lvl3_data.length).toEqual(1);
      expect(fileNames.includes("test_3.svg")).toBeTruthy();
    });

    test("it should fail if a non proper file path is passed", async function () {
      skip(client, repo);
      const { data: pre_data } = await client!.storage.from("badges").list();
      let err = false;
      try {
        await repo!.put("test", svg); // test incorrect file name
      } catch (e) {
        err = true;
      }

      if (!err) throw new Error("Error was expected to be thrown");

      const { data: post_data } = await client!.storage.from("badges").list();
      if (!pre_data || !post_data) throw new Error("Data Not Returned");
      expect(post_data.length).toEqual(pre_data.length);
    });
  });

  describe("get", () => {
    describe("It should get an existing document if it exists", function () {
      test("It should get an existing document with no path", async function () {
        skip(client, repo);
        const path = "test.svg";
        await repo!.put(path, svg); //test no path
        const res = await repo!.get(path);
        expect(res).toEqual(svg);
      });
      test("It should get an existing document with a single path", async function () {
        skip(client, repo);
        const path = "test/test.svg"; //test in single file
        await repo!.put(path, svg);
        const res = await repo!.get(path);
        expect(res).toEqual(svg);
      });
      test("It should get an existing document with a compound path", async function () {
        skip(client, repo);
        const path = "test/get/test.svg"; //test in compound files
        await repo!.put(path, svg);
        const res = await repo!.get(path);
        expect(res).toEqual(svg);
      });
    });
    test("It should throw an error if the file doesn't exist", async function () {
      skip(client, repo);
      try {
        await repo!.get("test/nonexistant/test.svg");
      } catch {
        return;
      }
      throw new Error(
        "Expected an error to be thrown as the file does not exists"
      );
    });
    test("It should throw an error if an invalid file path is passed", async function () {
      skip(client, repo);
      try {
        await repo?.get("testing/bad_filename");
      } catch {
        return;
      }
      throw new Error(
        "Expected an error to be thrown as an invalid filepath was passed"
      );
    });
  });

  describe("exists", () => {
    describe("It should return true if the document exists", function () {
      test("It should return true if the document exist with only file name", async function () {
        skip(client, repo);
        const path = "test.svg";
        await repo!.put(path, svg);
        const exist = await repo!.exists(path);
        expect(exist).toBeTruthy();
      });
      test("It should return true if the document exists with file in single folder", async function () {
        skip(client, repo);
        const path = "exist/test.svg";
        await repo!.put(path, svg);
        const exist = await repo!.exists(path);
        expect(exist).toBeTruthy();
      });
      test("It should return true if the document exist with file in compound folders", async function () {
        skip(client, repo);
        const path = "test/exist/test.svg";
        await repo!.put(path, svg);
        const exist = await repo!.exists(path);
        expect(exist).toBeTruthy();
      });
    });
    test("It should return false if the document does not exist", async function () {
      skip(client, repo);
      const exist = await repo!.exists("doesnt_exist.svg");
      expect(exist).toBeFalsy();
    });
    test("It should not throw an error if an incorrect file path is passed", async function () {
      skip(client, repo);
      const exist = await repo!.exists("test/bad_filename");
      expect(exist).toBeFalsy();
    });
  });
});
