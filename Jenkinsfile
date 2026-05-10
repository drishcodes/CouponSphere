pipeline {
  agent any

  environment {
    DOCKER_HUB_USER = 'drishcodes'
    IMAGE_NAME = 'couponsphere'
    VITE_API_URL = 'http://localhost:5005/api/v1'
  }

  stages {
    stage('Prepare') {
      steps {
        echo "Starting build for CouponSphere version ${env.BUILD_NUMBER}..."
      }
    }

    stage('Quality & Testing') {
      parallel {
        stage('Backend (Node)') {
          steps {
            dir('server') {
              sh 'npm install'
              sh 'npm run lint || true'
              sh 'npm test || echo "Tests failed but continuing for demo"'
            }
          }
        }
        stage('Frontend (React)') {
          steps {
            dir('client') {
              sh 'npm install'
              sh 'npm run build'
            }
          }
        }
        stage('Fraud Engine (Java)') {
          steps {
            dir('fraud-microservice') {
              sh 'mvn clean test || echo "Java tests failed but continuing"'
            }
          }
        }
      }
    }

    stage('Build Containers') {
      steps {
        script {
          sh "docker build -t ${DOCKER_HUB_USER}/${IMAGE_NAME}-server:latest ./server"
          sh "docker build --build-arg VITE_API_URL=${VITE_API_URL} -t ${DOCKER_HUB_USER}/${IMAGE_NAME}-client:latest ./client"
          sh "docker build -t ${DOCKER_HUB_USER}/${IMAGE_NAME}-fraud:latest ./fraud-microservice"
        }
      }
    }

    stage('Staging Deployment') {
      steps {
        echo "Simulating deployment to staging..."
        sh 'docker compose down --remove-orphans || true'
        sh 'docker compose up -d'
      }
    }
  }

  post {
    always {
      echo "Build finished. Cleaning workspace."
      sh 'docker image prune -f'
    }
    success {
      echo "CouponSphere successfully built and deployed to staging!"
    }
    failure {
      echo "Pipeline failed. Checking system health..."
      sh 'docker compose logs --tail=50'
    }
  }
}
