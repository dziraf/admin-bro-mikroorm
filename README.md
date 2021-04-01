## admin-bro-mikroorm

This is an *unofficial* [admin-bro](https://github.com/SoftwareBrothers/admin-bro) adapter which integrates [MikroORM](https://github.com/mikro-orm/mikro-orm) into admin-bro.

Note that this is a first release and it's currently tested using only the example setup found in this repository.

If you are having trouble integrating this adapter in your project, please open an issue and try to describe the problem with as many details as possible.

### Installation

yarn
```bash
$ yarn add admin-bro-mikroorm
```

npm
```bash
$ npm i admin-bro-mikroorm
```

## Usage

The plugin can be registered using standard `AdminBro.registerAdapter` method.

```typescript
import { Database, Resource } from 'admin-bro-mikroorm';
import AdminBro from 'admin-bro';
import { validate } from 'class-validator';

const setupAdminBro = async () => {
  const orm = await MikroORM.init({
    entities: [User],
    dbName: process.env.DATABASE_NAME,
    type: 'postgresql',
    clientUrl: process.env.DATABASE_URL,
  });

  // MikroORM exposes it's entity manager through created ORM instance (`orm.em`) and it's required for
  // the adapter to run database queries. The static method `Resource.setORM` extracts required properties from your
  // ORM instance.
  Resource.setORM(orm);
  // If your entities use `class-validator` to validate data, you can inject it's validate method into the resource.
  Resource.validate = validate;
  AdminBro.registerAdapter({ Database, Resource });

  // You can instantiate AdminBro either by specifying all resources separately:
  const adminBro = new AdminBro({
    resources: [{ resource: User, options: {} }],
  });

  // Or by passing your ORM instance into `databases` property.
  const adminBro = new AdminBro({
    databases: [orm],
  });
  // You should choose to use either `resources` or `databases`
};
```

## Example

An example project can be found in `example-app` directory.

## Associations

Currently only `ManyToOne` and `OneToOne` relationships are supported due to current AdminBro's core limitations
for adapter integrations. `OneToMany` and `ManyToMany` relationships can still be achieved through a combination of custom components and hooks.

## Contribution

### Running the example app

If you want to set this up locally this is the suggested process:

1. Fork the repo
2. Install dependencies

```
yarn install
```

3. Register this package as a (linked package)[https://classic.yarnpkg.com/en/docs/cli/link/]

```
yarn link
```

4. Setup example app

Install all dependencies and use previously linked version of `admin-bro-mikroorm`.

```
cd example-app
yarn install
yarn link admin-bro-mikroorm
```

Optionally you might want to link your local version of `admin-bro` package

5. Make sure you have all the envs set (see `./example-app/example.env` and create an `.env` file based on that)

6. Build the package in watch mode

(in the root folder)

```
yarn dev
```

6. Run the app in the dev mode

```
cd example-app
yarn dev
```

### Pull request

Before you make a PR make sure all tests pass and your code wont causes linter errors.
You can do this by running:

```
yarn lint
yarn test
```

Make sure you have an `.env` file in project's root directory for the test runner to use:
```
DATABASE_URL=postgres://postgres:@localhost:5433/mikroorm_test
DATABASE_NAME=mikroorm_test
```

