import { loginUser } from "../entrypoints";

jest.mock('axios');
const axios = require('axios');

describe('loginUser', () => {

  axios.get.mockImplementation(async (url, params) => {
    if (url === 'https://api.github.com/user') {
      if (params?.headers?.Authorization === 'token token123') {
        // TODO return mock data for user 
      }
    }
  })

  test('it should return the username if the user already exists', async () => {
    try {
      const user = await loginUser({ GithubToken: 'token1234' }, { auth: { uid: '123' } })
      expect(user.username).toBe(/* TODO: replace with expected username */)
    } catch (e) {
      fail();
    }
  });
  test('it should create a new db entry if the user does not already exist');
  test('it should be unable to login if the github token is not correct');
  test('it should throw a 400 if the github token is missing from the call');
  test('it should throw a 401 if the call comes from an unauthorize source');
})

