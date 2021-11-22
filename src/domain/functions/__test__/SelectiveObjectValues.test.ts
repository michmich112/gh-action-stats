import SelectiveObjectValues from '../SelectiveObjectValues';

describe('SelectiveObjectValues', () => {
  test('It should return all the values queried if they exist', () => {
    const data = {
      key1: "key1value",
      key2: "key2value",
      key3: "key3value",
      key4: "key4value"
    }
    const expected = {
      key1: "key1value",
      key2: "key2value",
      key3: "key3value",
      key4: "key4value"
    }
    const res = SelectiveObjectValues(data, ['key1', 'key2', 'key3', 'key4']);
    expect(res).toEqual(expected);
  });

  test('It should return an empty object if no values are queried', () => {
    const data = {
      key1: "key1value",
      key2: "key2value",
      key3: "key3value",
      key4: "key4value"
    }
    const res = SelectiveObjectValues(data, []);
    expect(res).toEqual({});
  });

  test('It should return an empty object if none of the values queried exist', () => {
    const data = {
      key1: "key1value",
      key2: "key2value",
      key3: "key3value",
      key4: "key4value"
    }
    const res = SelectiveObjectValues(data, ['key5', 'key6']);
    expect(res).toEqual({});
  });

  test('It should return all the values that exist if only a subset of them are present', () => {
    const data = {
      key1: "key1value",
      key2: "key2value",
      key3: "key3value",
      key4: "key4value"
    }
    const expected = {
      key2: "key2value",
      key3: "key3value",
    }
    const res = SelectiveObjectValues(data, ['key2', 'key3']);
    expect(res).toEqual(expected);
  });

  test('It should be able to return values at a deeper level', () => {
    const data = {
      key1: "key1value",
      key2: {
        key2_1: "key2_1value",
        key2_2: {
          key2_2_1: "key2_2_1value",
          key2_2_2: "key2_2_2value",
          key2_2_3: "key2_2_3value"
        },
        key2_3: {
          key2_3_1: "key2_3_1value"
        }
      },
      key3: "key3value"
    }
    const expected = {
      key1: "key1value",
      key2: {
        key2_1: "key2_1value",
        key2_2: {
          key2_2_1: "key2_2_1value",
          key2_2_3: "key2_2_3value"
        },
        key2_3: {
          key2_3_1: "key2_3_1value"
        }
      }
    }
    const res = SelectiveObjectValues(data, ['key1', 'key2.key2_1', 'key2.key2_2.key2_2_1', 'key2.key2_2.key2_2_3', 'key2.key2_3']);
    expect(res).toEqual(expected);
  });
});
