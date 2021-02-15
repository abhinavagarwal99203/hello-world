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
    REPO_URI = "abhinavagarwal99203/hello-world"
    SLACK_CHANNEL = "﻿slack-test"
    DOCKER_REGISTRY_URL = "${env.JENKINS_REGION == "us" ? "https://harbor.infrastructure.volvo.care" : "https://harbor.infra.volvocarstech.cn"}"
    OVERLAY_FILE = "${env.JENKINS_REGION == "us" ? "_deploy/overlays/infrastructure.volvo.care/kustomization.yaml" : "_deploy/overlays/infra.volvocarstech.cn/kustomization.yaml"}"
  }
  tools {
    maven 'maven'
  }
  stages {
    stage('Clone') {
      when {
        branch 'master'
        not { changelog '^bump tag : [a-z0-9]{7}$' }
      }
      steps {
        container('jnlp') {
          checkout scm
        }
      }
    }
    stage("Artifact"){
      when {
        branch 'master'
        not { changelog '^bump tag : [a-z0-9]{7}$' }
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

    stage('Deploy') {
      when {
        branch 'master'
        not { changelog '^bump tag : [a-z0-9]{7}$' }
      }
      steps {
        container('jnlp') {
          script {
            def filename = "${env.OVERLAY_FILE}"
            def data = readYaml file: filename
            data.images[0].newTag = env.DOCKER_IMAGE_TAG
            sh "rm $filename"
            writeYaml file: filename, data: data
            withCredentials([usernamePassword(credentialsId: env.GITHUB_CRED, passwordVariable: 'PASSWORD', usernameVariable: 'USERNAME')]) {
              sh "git add ${filename}"
              sh "git commit -m 'bump tag : ${env.DOCKER_IMAGE_TAG}'"
              sh "git remote set-url origin https://${env.USERNAME}:${env.PASSWORD}@github.com/volvo-cars/infrastructure-docs.git"
              sh "git push origin HEAD:master"
            }
          }
        }
      }
    }
  }
  post {
    success {
      slackSend (channel: "${env.SLACK_CHANNEL}", color: '#28a745', message: "*Success* ${env.BRANCH_NAME} | ${env.DOCKER_IMAGE_TAG}\n<${env.BUILD_URL}console|Track the build>")
    }
    failure {
      slackSend (channel: "${env.SLACK_CHANNEL}", color: '#dc3545', message: "*Failure* ${env.BRANCH_NAME} | ${env.DOCKER_IMAGE_TAG}\n<${env.BUILD_URL}console|Track the build>")
    }
  }
}