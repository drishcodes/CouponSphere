# Jenkins Integration Guide for CouponSphere

This guide explains how to set up and run the Jenkins pipeline for the CouponSphere project.

## 1. Prerequisites
- **Docker** installed on your host.
- **Docker Compose** installed.

## 2. Running Jenkins Locally
We have provided a `docker-compose.jenkins.yml` to spin up a Jenkins instance that can interact with your local Docker daemon (Docker-out-of-Docker).

```bash
docker compose -f docker-compose.jenkins.yml up -d
```

Jenkins will be available at `http://localhost:8081`.

## 3. Required Jenkins Plugins
To run the provided `Jenkinsfile`, you need to install the following plugins in Jenkins (**Manage Jenkins > Plugins > Available plugins**):
1. **Docker Pipeline**: Allows using `docker.build()` and `docker.withRegistry()`.
2. **Pipeline**: Core plugin for Declarative Pipelines.
3. **JUnit Plugin**: For archiving Java test results.
4. **Git Plugin**: For checking out code.
5. **NodeJS Plugin**: (Optional) If you want to use `tools { nodejs '...' }` instead of raw `sh`.

## 4. Setting up Credentials
The pipeline expects a Docker Hub credentials ID `docker-hub-creds`.
1. Go to **Manage Jenkins > Credentials > System > Global credentials**.
2. Click **Add Credentials**.
3. Kind: **Username with password**.
4. ID: `docker-hub-creds`.
5. Username: Your Docker Hub username.
6. Password: Your Docker Hub Personal Access Token (PAT).

## 5. Creating the Pipeline Job
1. Click **New Item** in Jenkins.
2. Enter `CouponSphere-Pipeline` and select **Pipeline**.
3. Under **Pipeline > Definition**, select **Pipeline script from SCM**.
4. SCM: **Git**.
5. Repository URL: (Your repository URL).
6. Script Path: `Jenkinsfile`.
7. Click **Save** and **Build Now**.

## 6. Pipeline Features
- **Parameters**: You can choose between `staging` and `production` environments.
- **Parallel Stages**: Tests for Server, Client, and Fraud microservice run simultaneously to save time.
- **Automated Versioning**: Images are tagged with the Jenkins build number.
- **K8s Manifest Update**: Automatically updates image tags in `./k8s` manifests before deployment.

---
**Note:** The deployment stage currently simulates `kubectl apply`. To enable real deployment, you must have `kubectl` configured on the Jenkins agent and uncomment the `sh 'kubectl apply ...'` lines in the `Jenkinsfile`.
