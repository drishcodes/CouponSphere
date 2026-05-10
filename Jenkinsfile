pipeline {
  agent any

  environment {
    IMAGE_NAMESPACE = 'couponsphere'
  }

  stages {
    stage('Install') {
      parallel {
        stage('Server Dependencies') {
          steps { dir('server') { sh 'npm install' } }
        }
        stage('Client Dependencies') {
          steps { dir('client') { sh 'npm install' } }
        }
        stage('Fraud Maven Dependencies') {
          steps { dir('fraud-microservice') { sh 'mvn -B dependency:go-offline' } }
        }
      }
    }

    stage('Test') {
      parallel {
        stage('Server Tests') {
          steps { dir('server') { sh 'npm test' } }
        }
        stage('Client Tests') {
          steps { dir('client') { sh 'npm test -- --run' } }
        }
        stage('Fraud Tests') {
          steps { dir('fraud-microservice') { sh 'mvn test' } }
        }
      }
    }

    stage('Build') {
      steps {
        sh 'docker build -t $IMAGE_NAMESPACE/server:$BUILD_NUMBER ./server'
        sh 'docker build -t $IMAGE_NAMESPACE/client:$BUILD_NUMBER ./client'
        sh 'docker build -t $IMAGE_NAMESPACE/fraud:$BUILD_NUMBER ./fraud-microservice'
      }
    }

    stage('Deploy') {
      steps {
        sh 'docker compose up -d --build'
      }
    }
  }

  post {
    failure {
      sh 'docker compose logs --tail=200'
      echo 'Rollback: redeploy the previous successful image tag from registry or restore the last compose bundle.'
    }
  }
}
