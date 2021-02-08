// Jenkinsfile

pipeline {
  agent {
    kubernetes {
      label 'jenkins-slave-base'
    }
  }
  options {
    ansiColor('xterm')
  }
  environment {
    GIT_COMMIT_SHORT = env.GIT_COMMIT.take(7)
    DOCKER_IMAGE_TAG = "${env.GIT_COMMIT_SHORT}"
    REPO_URI = "bakeryharborrepo/sptools"
    DOCKER_REGISTRY_URL = "${env.JENKINS_REGION == "us" ? "https://harbor.infrastructure.volvo.care" : "https://harbor.infra.volvocarstech.cn"}"
  }
  stages {
    stage('Clone') {
      steps {
        container('jnlp') {
          checkout scm
        }
      }
    }
    stage("Artifact"){
      when {
        branch 'develop'
      }
      steps {
        publishDockerImage(
          repository: env.REPO_URI,
          imageTag: env.DOCKER_IMAGE_TAG,
          registryCredentialsID: "harbor",
          registryURL: env.DOCKER_REGISTRY_URL
        )
      }
    }
    stage('Scan images') {
      steps {
        imageVulnerabilitiesScan(fullImageName: "${env.REPO_URI}:${env.DOCKER_IMAGE_TAG}")
      }
    }
    stage('DeployToDev') {
      when {
        branch 'develop'
      }
      steps {
        createSpinnakerArtifacts(
          chartPath: env.CHART_PATH,
          overrideValuesPath: "${env.CHART_PATH}/overrides-development.yaml", // This argument could be ommited
          propertiesFileName: "build.properties", // This argument could be ommited
          imageTag: env.DOCKER_IMAGE_TAG
        )
      }
    }
  }
}