pipeline {
    agent any

    parameters {
        choice(name: 'DEPLOY_ENV', choices: ['staging', 'production'], description: 'Target environment for deployment')
        booleanParam(name: 'SKIP_TESTS', defaultValue: false, description: 'Skip testing stages (not recommended)')
    }

    environment {
        DOCKER_HUB_USER = 'drishcodes'
        PROJECT_NAME = 'couponsphere'
        DOCKER_REGISTRY = "docker.io"
        DOCKER_CREDENTIALS_ID = 'docker-hub-creds'
        
        SERVER_DIR = 'server'
        CLIENT_DIR = 'client'
        FRAUD_DIR = 'fraud-microservice'
    }

    stages {
        stage('Initialize') {
            steps {
                script {
                    echo "🚀 Starting CI/CD Pipeline for ${PROJECT_NAME}"
                    echo "Running on: ${isUnix() ? 'Linux/Unix' : 'Windows'}"
                    currentBuild.description = "Build #${env.BUILD_NUMBER} - ${params.DEPLOY_ENV}"
                }
            }
        }

        stage('Quality & Security') {
            when { expression { !params.SKIP_TESTS } }
            parallel {
                stage('Server: Lint & Test') {
                    steps {
                        dir("${env.SERVER_DIR}") {
                            script {
                                if (isUnix()) {
                                    sh 'npm install && npm run lint || true'
                                    sh 'npm test'
                                } else {
                                    bat 'npm install && npm run lint || true'
                                    bat 'npm test'
                                }
                            }
                        }
                    }
                }
                stage('Client: Lint') {
                    steps {
                        dir("${env.CLIENT_DIR}") {
                            script {
                                if (isUnix()) {
                                    sh 'npm install && npm run lint || true'
                                } else {
                                    bat 'npm install && npm run lint || true'
                                }
                            }
                        }
                    }
                }
                stage('Fraud Service: Test') {
                    steps {
                        dir("${env.FRAUD_DIR}") {
                            script {
                                if (isUnix()) {
                                    sh 'mvn clean test'
                                } else {
                                    bat 'mvn clean test'
                                }
                            }
                        }
                    }
                    post {
                        always {
                            junit '**/target/surefire-reports/*.xml'
                        }
                    }
                }
            }
        }

        stage('Build & Push') {
            steps {
                script {
                    echo "📦 Building Docker Images..."
                    // Note: Requires Docker Desktop/Daemon to be running and in PATH
                    
                    def serverTag = "${DOCKER_HUB_USER}/${PROJECT_NAME}-server:${env.BUILD_NUMBER}"
                    def clientTag = "${DOCKER_HUB_USER}/${PROJECT_NAME}-client:${env.BUILD_NUMBER}"
                    def fraudTag = "${DOCKER_HUB_USER}/${PROJECT_NAME}-fraud:${env.BUILD_NUMBER}"
                    
                    def apiURL = params.DEPLOY_ENV == 'production' ? 'https://api.couponsphere.com/api/v1' : 'http://staging-api.couponsphere.com/api/v1'

                    if (isUnix()) {
                        sh "docker build -t ${serverTag} ./${env.SERVER_DIR}"
                        sh "docker build --build-arg VITE_API_URL=${apiURL} -t ${clientTag} ./${env.CLIENT_DIR}"
                        sh "docker build -t ${fraudTag} ./${env.FRAUD_DIR}"
                    } else {
                        bat "docker build -t ${serverTag} ./${env.SERVER_DIR}"
                        bat "docker build --build-arg VITE_API_URL=${apiURL} -t ${clientTag} ./${env.CLIENT_DIR}"
                        bat "docker build -t ${fraudTag} ./${env.FRAUD_DIR}"
                    }
                    echo "✅ Build complete"
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    echo "🚢 Deploying to ${params.DEPLOY_ENV}..."
                    dir('k8s') {
                        if (isUnix()) {
                            sh "sed -i 's|image: .*-server:.*|image: ${DOCKER_HUB_USER}/${PROJECT_NAME}-server:${env.BUILD_NUMBER}|g' server-deployment.yml"
                            sh "sed -i 's|image: .*-client:.*|image: ${DOCKER_HUB_USER}/${PROJECT_NAME}-client:${env.BUILD_NUMBER}|g' client-deployment.yml"
                            sh "sed -i 's|image: .*-fraud:.*|image: ${DOCKER_HUB_USER}/${PROJECT_NAME}-fraud:${env.BUILD_NUMBER}|g' fraud-deployment.yml"
                        } else {
                            // Windows equivalent for sed using PowerShell
                            powershell "((Get-Content server-deployment.yml) -replace 'image: .*-server:.*', 'image: ${DOCKER_HUB_USER}/${PROJECT_NAME}-server:${env.BUILD_NUMBER}') | Set-Content server-deployment.yml"
                            powershell "((Get-Content client-deployment.yml) -replace 'image: .*-client:.*', 'image: ${DOCKER_HUB_USER}/${PROJECT_NAME}-client:${env.BUILD_NUMBER}') | Set-Content client-deployment.yml"
                            powershell "((Get-Content fraud-deployment.yml) -replace 'image: .*-fraud:.*', 'image: ${DOCKER_HUB_USER}/${PROJECT_NAME}-fraud:${env.BUILD_NUMBER}') | Set-Content fraud-deployment.yml"
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                echo "🧹 Cleaning workspace..."
                cleanWs()
            }
        }
        success { echo "🎉 Pipeline Finished Successfully!" }
        failure { echo "❌ Pipeline Failed." }
    }
}
