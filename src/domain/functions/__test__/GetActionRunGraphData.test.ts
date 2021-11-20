import getActionRunGraphData, { getActionActorsGraphData, getActionReposGraphData, getDaysBetweenDates } from '../GetActionRunGraphData';

describe('getDaysBetweenDates', () => {
  test('it should give the right dates for range within a month', () => {
    const start = new Date(Date.parse('2021-11-01T00:00:01.000Z'));
    const end = new Date(Date.parse('2021-11-03T00:00:00.000Z'));
    const expectedRange = ['2021-11-01T00:00:00.000Z', '2021-11-02T00:00:00.000Z', '2021-11-03T00:00:00.000Z'].map(v => new Date(Date.parse(v)));
    const range = getDaysBetweenDates(start, end);
    expect(range).toEqual(expectedRange);
  });

  test('it should give the right dates for the range within a single day', () => {
    const start = new Date(Date.parse('2021-11-01T00:00:01.000Z'));
    const end = new Date(Date.parse('2021-11-01T05:59:59.000Z'));
    const expectedRange = [new Date(Date.parse('2021-11-01T00:00:00.000Z'))];
    const range = getDaysBetweenDates(start, end);
    expect(range).toEqual(expectedRange);
  });

  test('it should return the right date for range within a single day but with a changed time zone', () => {
    const start = new Date(Date.parse('2021-11-01T00:00:01.000Z'));
    const end = new Date(Date.parse('2021-11-01T10:59:59.000Z'));
    const expectedRange = ['2021-11-01T00:00:00.000Z', '2021-11-02T00:00:00.000Z'].map(v => new Date(Date.parse(v)));
    const range = getDaysBetweenDates(start, end);
    expect(range).toEqual(expectedRange);
  })

  test('it should give the right dates for ther range between months', () => {
    const start = new Date(Date.parse('2021-10-31T00:00:00.000Z'));
    const end = new Date(Date.parse('2021-11-02T00:00:00.000Z'));
    const expectedRange = ['2021-10-31T00:00:00.000Z', '2021-11-01T00:00:00.000Z', '2021-11-02T00:00:00.000Z'].map(v => new Date(Date.parse(v)));
    const range = getDaysBetweenDates(start, end);
    expect(range).toEqual(expectedRange);

  });

  test('it should return an empty array if the end date is before the start date', () => {
    const start = new Date(Date.parse('2021-11-01T00:00:00.000Z'));
    const end = new Date(Date.parse('2021-10-20T00:00:00.000Z'));
    const expectedRange = [];
    const range = getDaysBetweenDates(start, end);
    expect(range).toEqual(expectedRange);
  });

})

const data = [
  {
    actor: "actor1",
    ip: "192.168.0.1",
    os: "Linux",
    timestamp: '2021-11-01T00:00:00.000Z',
    repository: 'actor1/repository1',
    is_private: false,
  },
  {
    actor: "actor2",
    ip: "192.168.0.1",
    os: "Linux",
    timestamp: '2021-11-01T01:00:00.000Z',
    repository: 'actor1/repository1',
    is_private: false,
  },
  {
    actor: "actor1",
    ip: "192.168.0.1",
    os: "Linux",
    timestamp: '2021-11-01T02:20:00.000Z',
    repository: 'actor1/repository1',
    is_private: false,
  },
  {
    actor: "actor2",
    ip: "192.168.0.1",
    os: "Linux",
    timestamp: '2021-11-03T00:00:00.000Z',
    repository: 'actor1/repository2',
    is_private: false,
  }
];

describe('getActionRunGraphData', () => {
  test('it should return the correct count and labels', () => {
    const expected = {
      labels: ['2021-10-31', '2021-11-01', '2021-11-02'],
      data: [3, 0, 1]
    };
    const ret = getActionRunGraphData(data);
    expect(ret).toEqual(expected);
  });
});

describe('getActionReposGraphData', () => {
  test('it should return the correct count and labels', () => {
    const expected = {
      labels: ['2021-10-31', '2021-11-01', '2021-11-02'],
      data: [1, 0, 1]
    };
    const ret = getActionReposGraphData(data);
    expect(ret).toEqual(expected);
  });
});

describe('getActionActorsGraphData', () => {
  test('it should return the correct count and labels', () => {
    const expected = {
      labels: ['2021-10-31', '2021-11-01', '2021-11-02'],
      data: [2, 0, 1]
    };
    const ret = getActionActorsGraphData(data);
    expect(ret).toEqual(expected);
  });
});

