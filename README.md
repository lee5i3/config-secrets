# Config Secrets

A plug-in for [config](https://www.npmjs.com/package/config) module to support docker secrets.

### Prerequisites

In order for the secrets to work, you will need a ``` custom-environment-variables ``` file in your config folder, it will use the environment variable names as the secret name.

###### custom-environment-variables.yml
```
default:
  service:
    port: "PORT"
  mq:
    host: "MQ_HOST"
```

### Installing

```
$ npm install config-secrets
```


## Configuration

To change the location where the docker secrets are stored, you can add a ``` SECRETS_PATH ``` environment variable, default location is ``` /run/secrets ```

## Notes

Environment variables takes precedent over docker secrets, so if your application needs different setting over the docker secret, you can add the environment variable to overwrite it.
