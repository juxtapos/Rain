# Elastic architecture

In this document you can find the overview of elastic RAIN architecture. Each component of the architecture is described in great detail.

## Revisions

<table>
   <thead bgcolor="#CCC">
      <tr>
         <th>Author</th>
         <th>Version</th>
         <th>Changes</th>
       </tr>
   </thead>

   <tbody>
       <tr>
          <th>Radu Cosnita</th>
          <th>1.0-SNAPSHOT</th>
          <th>Initial proposal for elastic architecture.</th>
       </tr>
   </tbody>
</table>

## Scope

RAIN must be a framework that provides a compatible web 2.0 way of developing application. RAIN takes into consideration deployment details and provides a rich API for interacting with every piece of the architecture.

## Stakeholders interests

<table>
   <thead>
       <tr>
          <th>Stakeholder</th>
          <th>Interests</th>
          <th>Acceptance scenario</th>
       </tr>
   </thead>

   <tbody>
        <tr>
	<td>Network administrators</td>
           <td><ul>
              <li>RAIN deployment control</li>
              <li>RAIN monitoring</li>
              <li>RAIN deployment performance</li>
           </ul></td>
           <td><ul>
              <li>Stress tests - more detailed description will come.</li>
              <li>Failover tests.</li>
              <li>Monitoring tests.</li>
              <li>Dynamic configuration tests.</li>
           </ul></td>
        </tr>
   </tbody>
</table>

## Functional requirements (FR)

Here you can find all the functional requirements for this architecture.

   1. RAIN must support small units of code acting as a single application.
   1. RAIN must provide an infrastructure map.

## Non functional requirements (NFR)

   1. RAIN must reuse already tested load balancers.

## Use cases

## Design

_See deployment diagram for RAIN Cloud_

In the above diagram you can see a small cloud rain deployment. The idea behind this architecture is that we have an cloud orchestrator (hypervisor) that can at any time provide information about the cloud. The communication is done through web sockets and is event based. The purpose is to obtain an incomplete connected graph that is used based on some criterias: the components that can be handled by a cloud unit, cpu usage, bandwidth usage, ram usage and so on. The hypervisor should _orchestrate_ this interaction. 

Also the hypervisor should allow through it's public API to dynamically change the cloud structure:

   1. Deploy a new webcomponent.
   1. Instantiate a new webcomponent.
   1. Destroy an instance of a webcomponent.
   1. Undeploy an instance of a webcomponent.

_This can be adjusted to the documents presented to us by _

### RAIN Server

A rain server is a node that is responsible for doing aggregation and applying cross cutting concerns provided by RAIN framework. A rain server can be connected to one or more motherships simultaneously. On long run new mothership connection will be probably opened.

### RAIN Cloud API

RAIN Cloud API is intended to become the only interface that provides information about RAIN Cloud and orchestrate the wiring process. In this context wiring define the link between a RAIN Server and a subset of running motherships.

Below you can find all operations defined in REST manner that must be provided by RAIN Cloud API:

<table>
   <thead>
      <tr>
         <th>Group</th>
         <th>Operation</th>
         <th>HTTP method</th>
         <th>HTTP Headers</th>
         <th>HTTP body</th>
         <th>Description</th>
      </tr>
   </thead>

   <tbody>
      <tr>
         <td colspan="5"><p>We assume that cloud api is deployed within the intranet and has an url assigned to it. Of course the environment can be load balanced. The accessible url might be: https://cloud.rain.1and1.com/. All operation urls are relative to this address.</p></td>
      </tr>

      <tr>
          <td>Mothership</td>
          <td>Load all motherships.</td>
          <td>GET - /mothership/all</td>
          <td>-</td>
          <td>Obtain a list of all registered motherships.</td>
      </tr>

      <tr>
          <td></td>
          <td>Load mothership summary.</td>
          <td>GET - /mothership/{mothershipid}</td>
          <td>-</td>
          <td>Obtain a summary of the specified mothership.</td>
      </tr>

      <tr>
          <td></td>
          <td>Load mothership components</td>
          <td>GET - /mothership/{mothershipid}/webcomponents</td>
          <td>-</td>
          <td>Obtain all webcomponents instances currently deployed in the specified mothership.</td>
      </tr>

      <tr>
          <td></td>
          <td>Register mothership</td>
          <td>POST - /mothership/</td>
          <td>-</td>
          <td>Register a new mothership to the hypervisor.</td>
      </tr>

      <tr>
          <td>RAIN Server</td>
          <td></td>
          <td>GET - </td>
          <td></td>
          <td></td>
      </tr>

      <tr>
          <td>Webcomponent</td>
          <td>Load all deployed components</td>
          <td>GET - /webcomponent/all?start=[start_record]&amp;range=[num_of_records]</td>
          <td><ul>
             <li>Content-Type: application/json</li>
             <li>accept: application/json</li>
             <li>user: [user token]</li>
          </ul></td>
          <td>-</td>
          <td>Operation used to obtain a list of all deployed web components within the cloud.</td>
      </tr>

      <tr>
          <td></td>
          <td>Load detailed information about an available webcomponent.</td>
          <td>GET - /webcomponent/{id}/{version}</td>
          <td><ul>
             <li>Content-Type: application/json</li>
             <li>accept: application/json</li>
             <li>user: [user token]</li>
          </ul></td>
          <td>-</td>
          <td>Operation used to obtain information about an available webcomponent within the cloud: motherships on which is deployed, description, and other things..</td>
      </tr>

      <tr>
          <td></td>
          <td>Load webcomponent descriptor.</td>
          <td>GET - /webcomponent/{id}/{version}/descriptor</td>
          <td><ul>
             <li>Content-Type: application/json</li>
             <li>accept: application/json</li>
             <li>user: [user token]</li>
          </ul></td>
          <td>-</td>
          <td>Operation used to obtain the configuration descriptor of a webcomponent (meta.json content).</td>
      </tr>

      <tr>
          <td></td>
          <td>Load web component statistics.</td>
          <td>GET - /webcomponent/{id}/{version}/statistics</td>
          <td><ul>
             <li>Content-Type: application/json</li>
             <li>accept: application/json</li>
             <li>user: [user token]</li>
          </ul></td>
          <td>-</td>
          <td>Operation used to obtain monitoring information about an available webcomponent.</td>
      </tr>

      <tr>
          <td></td>
          <td>Load webcomponent instance information.</td>
          <td>GET - /webcomponent/{instanceid}</td>
          <td><ul>
             <li>Content-Type: application/json</li>
             <li>accept: application/json</li>
             <li>user: [user token]</li>
          </ul></td>
          <td>-</td>
          <td>Operation used to obtain information about a specific web component instance.</td>
      </tr>

      <tr>
          <td></td>
          <td>Instantiate a specified webcomponent.</td>
          <td>POST - /webcomponent/{id}/{version}</td>
          <td><ul>
             <li>Content-Type: application/json</li>
             <li>accept: application/json</li>
             <li>user: [user token]</li>
          </ul></td>
          <td>-</td>
          <td>Operation used to instantiate a specified webcomponent. Within this operation a complex processing will take place. A suitable mothership will be selected. All rain servers that require information about the new instance will open a connection to the chosen mothership (if no previous connection is available). Probably monitoring will also be enabled here. An instance identifier will be returned to client.</td>
      </tr>

      <tr>
          <td></td>
          <td>Load detailed information about an available webcomponent.</td>
          <td>PUT - /webcomponent/{id}/{version}</td>
          <td><ul>
             <li>Content-Type: application/json</li>
             <li>accept: application/json</li>
             <li>user: [user token]</li>
          </ul></td>
          <td>-</td>
          <td>Operation used to refresh all instances of the specified webcomponent.</td>
      </tr>

      <tr>
          <td></td>
          <td>Undeploy a specified webcomponent.</td>
          <td>DELETE - /webcomponent/{id}/{version}</td>
          <td><ul>
             <li>Content-Type: application/json</li>
             <li>accept: application/json</li>
             <li>user: [user token]</li>
          </ul></td>
          <td>-</td>
          <td>Operation used to undeploy all instances of a specified webcomponent.</td>
      </tr>

      <tr>
          <td></td>
          <td>Stop instance..</td>
          <td>DELETE - /webcomponent/{instanceid}</td>
          <td><ul>
             <li>Content-Type: application/json</li>
             <li>accept: application/json</li>
             <li>user: [user token]</li>
          </ul></td>
          <td>-</td>
          <td>Operation used to stop a specific instance.</td>
      </tr>

      <tr>
          <td></td>
          <td>Refresh instance..</td>
          <td>PUT - /webcomponent/{instanceid}</td>
          <td><ul>
             <li>Content-Type: application/json</li>
             <li>accept: application/json</li>
             <li>user: [user token]</li>
          </ul></td>
          <td>-</td>
          <td>Operation used to refresh a specific instance.</td>
      </tr>
   </tbody>
</table>

## Code samples

_Here come code samples meant to show how developers will use this feature._

## Timeline

_Here the estimated work of the feature must be split into packages of work that are correlated with the milestones._

_For instance we want to support Aspect Oriented Programming_

<table>
   <thead>
      <tr>
        <th>Milestone</th>
        <th>Usable parts</th>
        <th>Comments</th>
      </tr>
   </thead>

   <tbody>
   </tbody>
</table>
