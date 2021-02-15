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
    REPO_URI = "{{ REPO_URI }}"
    CHART_PATH = "{{ CHART_PATH }}"
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
        imageVulnerabilitiesScan(fullImageName: "harbor.infrastructure.volvo.care/bakeryharborrepo/helloworld-springboot-version2:latest")
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